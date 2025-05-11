import { Mapper } from '@automapper/core';
import { InjectMapper } from '@automapper/nestjs';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import dayjs from 'dayjs';
import {
  Brackets,
  DataSource,
  MoreThanOrEqual,
  Not,
  Repository,
} from 'typeorm';

import { PaginationRequestDto } from '../../../common/dto/pagination-request.dto';
import { PaginationResponseDto } from '../../../common/dto/pagination-response.dto';
import { NullableType } from '../../../common/types/nullable.type';
import { getUtcNow } from '../../../common/utils';
import { W24Error } from '../../../constants/error-code';
import { LoggerService } from '../../../shared/services/logger.service';
import { MembershipDto } from '../dtos/membership.dto';
import { MembershipCondition } from '../dtos/membership-condition.dto';
import {
  CreateMembershipDto,
  UpdateMembershipDto,
} from '../dtos/requests/create-membership.dto';
import { CreateUserMembershipDto } from '../dtos/requests/create-user-membership.dto';
import { UserMembershipDto } from '../dtos/user-membership.dto';
import { MembershipEntity } from '../entities/membership.entity';
import { UserMembershipEntity } from '../entities/user-membership.entity';
import { MembershipStatus } from '../enums/membership-status.enum';
import { MembershipType } from '../enums/membership-type.enum';

@Injectable()
export class MembershipService {
  private _userMembershipRepository: Repository<UserMembershipEntity>;
  private _membershipRepository: Repository<MembershipEntity>;

  constructor(
    @InjectMapper() private readonly _mapper: Mapper,
    @Inject(REQUEST) private readonly _req: any,
    private readonly _dataSource: DataSource,
    private readonly _logger: LoggerService,
  ) {
    this._userMembershipRepository =
      this._dataSource.getRepository(UserMembershipEntity);
    this._membershipRepository =
      this._dataSource.getRepository(MembershipEntity);
  }

  public async getMemberships(
    query: PaginationRequestDto,
  ): Promise<PaginationResponseDto<MembershipDto>> {
    const queryBuilder = this._membershipRepository
      .createQueryBuilder('memberships')
      .orderBy('memberships.createdAt', query.order);

    const [items, meta] = await queryBuilder.paginate(query);

    const dtos = this._mapper.mapArray(items, MembershipEntity, MembershipDto);
    return dtos.toPagination(meta);
  }

  public async create(request: CreateMembershipDto): Promise<MembershipDto> {
    const entity = this._mapper.map(
      request,
      CreateMembershipDto,
      MembershipEntity,
    );

    if (entity.name) {
      const isNameValid: boolean = await this._validateName(null, entity.name);
      if (!isNameValid) {
        throw new BadRequestException(W24Error.AlreadyExists('Name'));
      }
    }

    const membership = await this._membershipRepository.save(entity);
    return this._mapper.map(membership, MembershipEntity, MembershipDto);
  }

  public async update(request: UpdateMembershipDto): Promise<boolean> {
    const currEntity = await this._membershipRepository.findOneBy({
      id: request.id,
    });

    if (!currEntity) {
      throw new BadRequestException(W24Error.NotFound('Membership'));
    }

    const entity = this._mapper.map(
      request,
      UpdateMembershipDto,
      MembershipEntity,
    );

    if (entity.name) {
      const isNameValid: boolean = await this._validateName(
        entity.id,
        entity.name,
      );
      if (!isNameValid) {
        throw new BadRequestException(W24Error.AlreadyExists('Name'));
      }
    }

    const membership = await this._membershipRepository.save(entity);
    return !!membership;
  }

  public async getMembership(id: string): Promise<MembershipDto> {
    const entity = await this._membershipRepository.findOneBy({ id });

    if (!entity) {
      throw new BadRequestException(W24Error.NotFound('Membership'));
    }

    return this._mapper.map(entity, MembershipEntity, MembershipDto);
  }

  public async delete(id: string): Promise<boolean> {
    const membership = await this._membershipRepository.findOneBy({ id });
    if (!membership) {
      throw new BadRequestException(W24Error.NotFound('Membership'));
    }

    const userMembership = await this._userMembershipRepository.findOneBy({
      membershipId: id,
      status: MembershipStatus.ACTIVE,
      endAt: MoreThanOrEqual(getUtcNow()),
    });
    if (userMembership) {
      throw new BadRequestException(W24Error.MembershipInUse);
    }

    await this._membershipRepository.softRemoveAndSave(membership);
    return true;
  }

  public async createUserMembership(
    req: CreateUserMembershipDto,
  ): Promise<UserMembershipDto> {
    const membership = await this._membershipRepository.findOneBy({
      id: req.membershipId,
    });
    if (!membership) {
      throw new BadRequestException(W24Error.NotFound('Membership'));
    }

    const condition: MembershipCondition = {
      vehicleIds: [],
    };

    switch (membership.type) {
      case MembershipType.BASIC: {
        const vehicleId = req.vehicleIds?.[0];
        if (!vehicleId) {
          throw new BadRequestException(
            W24Error.MissingRequiredField('vehicleId'),
          );
        }
        condition.vehicleIds = [vehicleId];
        break;
      }
      case MembershipType.STANDARD: {
        // TODO: limit vehicleIds
        if (!req.vehicleIds?.length) {
          throw new BadRequestException(
            W24Error.MissingRequiredField('vehicleIds'),
          );
        }
        condition.vehicleIds = req.vehicleIds;
        break;
      }
      case MembershipType.PREMIUM:
      default:
        break;
    }

    const userMembership: Partial<UserMembershipEntity> = {
      startAt: getUtcNow(),
      endAt: dayjs(getUtcNow()).add(membership.duration, 'day').toDate(),
      status: MembershipStatus.ACTIVE,
      userId: req.userId,
      membershipId: membership.id,
      condition: condition,
    };

    const entity = await this._userMembershipRepository.save(userMembership);
    entity.membership = membership;

    return this._mapper.map(entity, UserMembershipEntity, UserMembershipDto);
  }

  public async getCurrentMembership(
    vehicleId?: string,
  ): Promise<UserMembershipDto> {
    const userId = this._req.user?.id;
    if (!userId) return null;

    try {
      const builder = this._userMembershipRepository
        .createQueryBuilder('um')
        .leftJoinAndSelect('um.membership', 'membership')
        .where({
          userId: userId,
          status: MembershipStatus.ACTIVE,
          endAt: MoreThanOrEqual(getUtcNow()),
        });

      if (vehicleId) {
        builder.andWhere(
          new Brackets((qp) => {
            qp.where(
              `um.condition IS NOT NULL AND ("um"."condition"::jsonb->>'vehicleIds')::jsonb ?| ARRAY[:...vehicleIds]`,
              {
                vehicleIds: [vehicleId],
              },
            )
              .orWhere(
                `um.condition IS NOT NULL AND ("um"."condition"::jsonb->>'vehicleIds')::jsonb <@ '[]' ::jsonb`,
              )
              .orWhere(`um.condition IS NULL`);
          }),
        );
      }

      const userMembership = await builder.getOne();
      if (!userMembership) return null;

      const dto = this._mapper.map(
        userMembership,
        UserMembershipEntity,
        UserMembershipDto,
      );
      return dto;
    } catch (error) {
      this._logger.error(error);
      return null;
    }
  }

  private async _validateName(
    id?: NullableType<string>,
    name?: string,
  ): Promise<boolean> {
    if (!name) return true;

    const builder = this._membershipRepository
      .createQueryBuilder('memberships')
      .where({ name });

    if (id) {
      builder.andWhere({ id: Not(id) });
    }

    const count = await builder.getCount();
    return count === 0;
  }
}
