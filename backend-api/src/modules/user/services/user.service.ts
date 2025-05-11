import { Mapper } from '@automapper/core';
import { InjectMapper } from '@automapper/nestjs';
import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { isEmail } from 'class-validator';
import type { FindOptionsWhere } from 'typeorm';
import { DataSource, IsNull, Not, Repository } from 'typeorm';

import { PaginationRequestDto } from '../../../common/dto/pagination-request.dto';
import { PaginationResponseDto } from '../../../common/dto/pagination-response.dto';
import { NullableType } from '../../../common/types/nullable.type';
import { generateHash, validateHash } from '../../../common/utils';
import { canSubmitReferral } from '../../../common/utils/user-utils';
import { EVENT } from '../../../constants';
import { SyncActionEnum } from '../../../constants/action';
import { IMG_PATH } from '../../../constants/config';
import { W24Error } from '../../../constants/error-code';
import { UserNotFoundException } from '../../../exceptions';
import { GeneratorProvider } from '../../../providers';
import { FCMService } from '../../../shared/services/fcm.service';
import { LoggerService } from '../../../shared/services/logger.service';
import { UploadService } from '../../../shared/services/upload.service';
import { ActivityLogDto } from '../../activity-logs/dtos/activity-log.dto';
import { ActionActivityEnum } from '../../activity-logs/enums/action-activity.enum';
import { AssistantLoginDto } from '../../auth/dto/request/login.dto';
import { AuthProvider } from '../../auth/enums/auth-provider.enum';
import { MembershipService } from '../../membership/services/membership.service';
import { RoleEntity } from '../../role-permission/entities/role.entity';
import { Role } from '../../role-permission/enums/roles.enum';
import { SyncRequestDto } from '../../sync/dtos/requests/sync.request.dto';
import { SubmitReferralRequest } from '../dtos/requests/submit-referral.request.dto';
import { UpdatePasswordDto } from '../dtos/requests/update-password.dto';
import { UpdateProfileDto } from '../dtos/requests/update-profile.dto';
import { UpdateUserNoteDto } from '../dtos/requests/update-user-note.dto';
import { UpdateUserStatusDto } from '../dtos/requests/update-user-status.dto';
import { UserDto } from '../dtos/user.dto';
import { ReferralEntity } from '../entities/referral.entity';
import { UserEntity } from '../entities/user.entity';
import { UserRoleEntity } from '../entities/user-role.entity';
import { canAccessFeatures } from '../enums/user-status.enum';
import { UserType } from '../enums/user-type.enum';

@Injectable()
export class UserService {
  private readonly _userRepository: Repository<UserEntity>;

  constructor(
    @InjectMapper() private readonly _mapper: Mapper,
    @Inject(REQUEST) private readonly _req: any,
    private readonly _upload: UploadService,
    private readonly _dataSource: DataSource,
    private readonly _membershipService: MembershipService,
    private readonly _fcmService: FCMService,
    private readonly _emitter: EventEmitter2,
    private readonly _logger: LoggerService,
  ) {
    this._userRepository = this._dataSource.getRepository(UserEntity);
  }

  public findOne(
    findData: FindOptionsWhere<UserEntity>,
  ): Promise<NullableType<UserEntity>> {
    return this._userRepository
      .createQueryBuilder('users')
      .leftJoinAndSelect('users.userRoles', 'userRoles')
      .where(findData)
      .getOne();
  }

  public async create(
    user: Partial<UserEntity>,
    roles: Role[],
  ): Promise<NullableType<UserEntity>> {
    if (!user.provider) {
      user.provider = AuthProvider.email;
    }

    if (user.provider === AuthProvider.email && !user.password) {
      throw new BadRequestException(W24Error.MissingRequiredField('Password'));
    }

    if (user.email) {
      const isEmailValid = await this._validateEmail(null, user.email);
      if (!isEmailValid) {
        throw new BadRequestException(W24Error.AlreadyExists('Email'));
      }
    }

    if (user.avatar) {
      user.avatar = await this._upload.uploadImageFromUrl(
        user.avatar,
        IMG_PATH.USER_AVATAR,
      );
    }

    const userRoles: UserRoleEntity[] = roles.map((item) => {
      const role = new UserRoleEntity();
      role.roleId = item;
      role.role = new RoleEntity();
      role.role.id = item;
      return role;
    });
    user.userRoles = userRoles;

    if (user.password) {
      user.password = generateHash(user.password);
    }

    user.referralCode = await this.generateReferralCode();

    const entity = await this._userRepository.save(user);

    this.emitSyncEvent(SyncActionEnum.Sync, entity.id);
    return entity;
  }

  public async update(id: string, user: Partial<UserEntity>): Promise<boolean> {
    if (user.email) {
      const isEmailValid = await this._validateEmail(id, user.email);
      if (!isEmailValid) {
        throw new BadRequestException(W24Error.AlreadyExists('Email'));
      }
    }

    const result = await this._userRepository.update(id, user);
    this.emitSyncEvent(SyncActionEnum.Sync, id);

    return !!result?.affected;
  }

  public async getUsers(
    query: PaginationRequestDto,
  ): Promise<PaginationResponseDto<UserDto>> {
    const queryBuilder = this._userRepository
      .createQueryBuilder('user')
      .orderBy('user.createdAt', query.order);
    const [items, meta] = await queryBuilder.paginate(query);

    const dtos = this._mapper.mapArray(items, UserEntity, UserDto);
    return dtos.toPagination(meta);
  }

  public async getUser(userId: string): Promise<UserDto> {
    const entity = await this._userRepository.findOneBy({
      id: userId,
    });

    if (!entity) {
      throw new UserNotFoundException();
    }

    return this._mapper.map(entity, UserEntity, UserDto);
  }

  public async getProfile(): Promise<UserDto> {
    const id = this._req?.user?.id;
    if (!id) throw new UserNotFoundException();

    const entity = await this._userRepository.findOne({
      where: { id },
      relations: ['referred'],
    });
    if (!entity) throw new UserNotFoundException();

    const canAccess = canAccessFeatures(entity.status);
    if (!canAccess) throw new UnauthorizedException(W24Error.UserBlocked);

    const dto = this._mapper.map(entity, UserEntity, UserDto);

    const userMembership = await this._membershipService.getCurrentMembership();
    dto.userMembership = userMembership;

    return dto;
  }

  private async _validateEmail(
    id?: NullableType<string>,
    email?: string,
  ): Promise<boolean> {
    if (!email) return true;

    if (!isEmail(email)) {
      throw new BadRequestException(W24Error.InvalidEmail);
    }

    const user = await this._userRepository.findOneBy({
      email: email,
    });

    return !user || user.id === id;
  }

  public async updateProfile(
    dto: UpdateProfileDto,
    file?: Express.Multer.File,
  ): Promise<UserDto> {
    const updateUser = this._mapper.map(dto, UpdateProfileDto, UserEntity);

    const id = this._req?.user?.id;
    if (!id) throw new UserNotFoundException();

    const user = await this.getValidatedUser({ id });
    if (!user) throw new UserNotFoundException();

    if (file) {
      updateUser.avatar = await this._upload.uploadImage(
        file,
        IMG_PATH.USER_AVATAR,
      );
      if (user.avatar) {
        await this._upload.deleteImages(user.avatar);
      }
    }

    await this.update(id, updateUser);
    return this.getUser(id);
  }

  public async deleteProfile(): Promise<boolean> {
    const id = this._req?.user?.id;
    if (!id) throw new UserNotFoundException();

    const user = await this.getValidatedUser({ id });
    if (!user) throw new UserNotFoundException();

    if (user.deviceTokens?.length) {
      await this._fcmService.unsubscribeToDefaultTopic(user.deviceTokens);
    }

    await this._userRepository.softRemoveAndSave(user);

    this._emitter.emit(EVENT.ACTIVITY_LOG, {
      objectId: id,
      action: ActionActivityEnum.UserDeleteAccount,
    });
    this.emitSyncEvent(SyncActionEnum.Delete, id);

    return true;
  }

  public async updatePassword(dto: UpdatePasswordDto): Promise<boolean> {
    const id = this._req?.user?.id;
    if (!id) throw new UserNotFoundException();

    const user = await this.getValidatedUser({ id });
    if (!user) throw new UserNotFoundException();

    if (!user?.password) {
      throw new BadRequestException(W24Error.InvalidAuthCredentials);
    }

    const isValidOldPassword = await validateHash(
      dto.oldPassword,
      user.password,
    );

    if (!isValidOldPassword) {
      throw new BadRequestException(W24Error.InvalidOldPassword);
    }

    const result = await this._userRepository.update(id, {
      password: generateHash(dto.password),
    });

    this._emitter.emit(EVENT.ACTIVITY_LOG, {
      objectId: id,
      action: ActionActivityEnum.UserChangePassword,
    });
    this.emitSyncEvent(SyncActionEnum.Sync, id);

    return !!result?.affected;
  }

  public async registerDeviceToken(token: string): Promise<boolean> {
    const id = this._req?.user?.id;
    if (!id) throw new UserNotFoundException();

    const user = await this._userRepository.findOneBy({ id });
    if (!user) throw new UserNotFoundException();

    const deviceTokens = new Set([...(user.deviceTokens || []), token]);
    user.deviceTokens = Array.from(deviceTokens);

    await this._userRepository.save(user);
    await this._fcmService.subscribeToDefaultTopic(token);

    this.emitSyncEvent(SyncActionEnum.Sync, id);

    return true;
  }

  public async removeDeviceToken(token: string): Promise<boolean> {
    const id = this._req?.user?.id;
    if (!id) throw new UserNotFoundException();

    const user = await this._userRepository.findOneBy({ id });
    if (!user) throw new UserNotFoundException();

    const deviceTokens = (user.deviceTokens || []).filter((e) => e !== token);
    user.deviceTokens = deviceTokens;

    await this._userRepository.save(user);
    await this._fcmService.unsubscribeToDefaultTopic(token);

    this.emitSyncEvent(SyncActionEnum.Sync, id);

    return true;
  }

  public async updateUserStatus(dto: UpdateUserStatusDto): Promise<UserDto> {
    const user = await this._userRepository.findOneBy({
      id: dto.id,
      type: UserType.CLIENT,
    });
    if (!user) throw new UserNotFoundException();

    if (user.status === dto.status) {
      throw new BadRequestException(W24Error.StatusAlreadyUpdated);
    }

    try {
      user.status = dto.status;
      const entity = await this._userRepository.save(user);

      const log: ActivityLogDto = {
        objectId: dto.id,
        action: ActionActivityEnum.UserChangeStatus,
        value: {
          status: dto.status,
          reason: dto.reason,
        },
      };

      this._emitter.emit(EVENT.ACTIVITY_LOG, log);
      this.emitSyncEvent(SyncActionEnum.Sync, dto.id);

      return this._mapper.map(entity, UserEntity, UserDto);
    } catch (error) {
      this._logger.error(error);
      throw new BadRequestException(error);
    }
  }

  public async updateUserNote(dto: UpdateUserNoteDto): Promise<UserDto> {
    const user = await this._userRepository.findOneBy({ id: dto.id });
    if (!user) throw new UserNotFoundException();

    try {
      user.note = dto.note || '';
      const entity = await this._userRepository.save(user);

      this.emitSyncEvent(SyncActionEnum.Sync, dto.id);

      return this._mapper.map(entity, UserEntity, UserDto);
    } catch (error) {
      this._logger.error(error);
      throw new BadRequestException(error);
    }
  }

  public async getValidatedUser(
    findData: FindOptionsWhere<UserEntity>,
  ): Promise<UserEntity> {
    const user = await this._userRepository.findOne({
      where: findData,
      relations: ['userRoles', 'referred'],
    });
    if (!user) return null;

    const canAccess = canAccessFeatures(user.status);
    if (!canAccess) {
      throw new UnauthorizedException(W24Error.UserBlocked);
    }

    return user;
  }

  public async getCurrentUser(): Promise<UserDto> {
    const id = this._req?.user?.id;
    if (!id) throw new UserNotFoundException();

    const entity = await this.getValidatedUser({ id });
    if (!entity) throw new UserNotFoundException();

    return this._mapper.map(entity, UserEntity, UserDto);
  }

  private emitSyncEvent(action: SyncActionEnum, userId: string): void {
    const req: SyncRequestDto = {
      id: userId,
      action: action,
    };
    this._emitter.emit(EVENT.SYNC.USER, req);
  }

  public async submitReferralCode(
    dto: SubmitReferralRequest,
  ): Promise<boolean> {
    try {
      const userId = this._req?.user?.id;
      if (!userId) throw new ForbiddenException();

      const currUser = await this._userRepository.findOne({
        where: { id: userId },
        relations: ['referred'],
      });
      if (!currUser) throw new UserNotFoundException();

      const canSubmit = canSubmitReferral(currUser);
      if (!canSubmit) {
        throw new BadRequestException(W24Error.UnexpectedError);
      }

      const referralUser = await this._userRepository.findOneBy({
        id: Not(currUser.id),
        referralCode: dto.referralCode,
      });
      if (!referralUser) {
        throw new BadRequestException(W24Error.NotFound('Referral_User'));
      }

      const referral: Partial<ReferralEntity> = {
        referralId: referralUser.id,
        referralCode: dto.referralCode,
        referredId: currUser.id,
      };

      await this._dataSource.getRepository(ReferralEntity).save(referral);
      return true;
    } catch (error) {
      this._logger.error(error);
      throw new BadRequestException(error);
    }
  }

  private async generateReferralCode(): Promise<string> {
    try {
      let isUnique = false;
      let code = '';

      while (!isUnique) {
        code = GeneratorProvider.generateReferralCode();

        const existingUser = await this._userRepository.findOneBy({
          referralCode: code,
        });

        if (!existingUser) {
          isUnique = true; // Break loop if the code is unique
        }
      }

      return code;
    } catch (error) {
      this._logger.error(error);
      return null;
    }
  }

  public async generateReferralCodeUsers(): Promise<void> {
    try {
      const users = await this._userRepository.findBy({
        referralCode: IsNull(),
      });

      for (const user of users) {
        user.referralCode = await this.generateReferralCode();
        await this._userRepository.save(user);

        this.emitSyncEvent(SyncActionEnum.Sync, user.id);
      }
    } catch (error) {
      this._logger.error(error);
      throw new BadRequestException(error);
    }
  }

  public async createAssistantUser(dto: AssistantLoginDto): Promise<UserDto> {
    const user = await this.findOne({
      email: dto.email,
    });

    if (!user) {
      const entity = await this.create(
        {
          email: dto.email,
          firstName: 'ASSISTANT',
          lastName: '',
          provider: AuthProvider.email,
          avatar: '',
          password: dto.password,
        },
        [Role.ASSISTANT],
      );

      return this._mapper.map(entity, UserEntity, UserDto);
    }

    const roles = (user.userRoles || []).map((role) => role.roleId);
    if (roles.includes(Role.ASSISTANT)) {
      throw new BadRequestException(W24Error.AlreadyExists('Assistant_User'));
    }

    return this._dataSource.transaction(async (manager) => {
      if (user.provider !== AuthProvider.email && !user.password) {
        await manager.getRepository(UserEntity).update(user.id, {
          password: generateHash(dto.password),
        });
      }

      const userRole: Partial<UserRoleEntity> = {
        userId: user.id,
        roleId: Role.ASSISTANT,
      };
      await manager.getRepository(UserRoleEntity).save(userRole);

      return this._mapper.map(user, UserEntity, UserDto);
    });
  }
}
