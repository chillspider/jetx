import { Mapper } from '@automapper/core';
import { InjectMapper } from '@automapper/nestjs';
import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DataSource, Repository } from 'typeorm';

import { PaginationRequestDto } from '../../../common/dto/pagination-request.dto';
import { PaginationResponseDto } from '../../../common/dto/pagination-response.dto';
import { EVENT } from '../../../constants';
import { SyncActionEnum } from '../../../constants/action';
import { IMG_PATH } from '../../../constants/config';
import { W24Error } from '../../../constants/error-code';
import { LoggerService } from '../../../shared/services/logger.service';
import { UploadService } from '../../../shared/services/upload.service';
import { AuthService } from '../../auth/services/auth.service';
import { ChatwootService } from '../../chatwoot/services/chatwoot.service';
import { NflowService } from '../../nflow/services/nflow.service';
import { OrderEntity } from '../../order/entities/order.entity';
import { SyncSupportDto } from '../../sync/dtos/sync-support.dto';
import { SyncTypeEnum } from '../../sync/enums/sync-action.enum';
import { UserDto } from '../../user/dtos/user.dto';
import { UserEntity } from '../../user/entities/user.entity';
import { CreateSupportRequestDto } from '../dtos/requests/create-support.request.dto';
import { UpdateSupportRequestDto } from '../dtos/requests/update-support.request.dto';
import { SupportDto } from '../dtos/support.dto';
import { SupportDataDto } from '../dtos/support-data.dto';
import { SupportEntity } from '../entities/support.entity';
import { SupportStatus } from '../enums/support-status.enum';

@Injectable()
export class SupportService {
  private readonly _supportRepository: Repository<SupportEntity>;

  constructor(
    @InjectMapper() private readonly _mapper: Mapper,
    @Inject(REQUEST) private readonly _req: any,
    private readonly _dataSource: DataSource,
    private readonly _upload: UploadService,
    private readonly _logger: LoggerService,
    private readonly _authService: AuthService,
    private readonly _nflow: NflowService,
    private readonly _chatwoot: ChatwootService,
    private readonly _emitter: EventEmitter2,
  ) {
    this._supportRepository = this._dataSource.getRepository(SupportEntity);
  }

  public async create(
    dto: CreateSupportRequestDto,
    images?: Express.Multer.File[],
  ): Promise<boolean> {
    const entity = this._mapper.map(
      dto,
      CreateSupportRequestDto,
      SupportEntity,
    );

    const user = this._req?.user;
    if (!user) throw new ForbiddenException();

    entity.customerEmail = user.email || dto.customerEmail;
    entity.customerId = user.id;
    entity.customerName ??= user.fullName;
    entity.customerPhone ??= user.phone;

    try {
      if (entity.orderId) {
        const order = await this._dataSource
          .getRepository(OrderEntity)
          .findOneBy({ id: entity.orderId });
        if (!order) throw new BadRequestException(W24Error.NotFound('Order'));
      }

      if (images?.length > 0) {
        const urls = await this.uploadImages(images);
        entity.images = urls;
      }

      const guid = await this._nflow.sync({
        type: SyncTypeEnum.SUPPORT,
        action: SyncActionEnum.Sync,
        data: this._mapper.map(entity, SupportEntity, SyncSupportDto),
      });
      if (!guid || typeof guid !== 'string') {
        throw new BadRequestException(W24Error.UnexpectedError);
      }

      entity.nflowId = guid;
      await this._supportRepository.save(entity);

      // Send mail support confirmation
      await this._authService.sendMailSupportConfirmation(user.email);

      return true;
    } catch (error) {
      this._logger.error(error);
      throw new BadRequestException(error);
    }
  }

  public async uploadImages(files: Express.Multer.File[]): Promise<string[]> {
    try {
      const tasks = files.map((file) =>
        this._upload.uploadImage(file, IMG_PATH.SUPPORT),
      );
      const urls = await Promise.all(tasks);
      return urls;
    } catch (error) {
      this._logger.error(error);
      throw new BadRequestException(error);
    }
  }

  public async getSupports(
    query: PaginationRequestDto,
  ): Promise<PaginationResponseDto<SupportDto>> {
    const userId = this._req?.user?.id;
    if (!userId) throw new ForbiddenException();

    const [items, meta] = await this._supportRepository
      .createQueryBuilder('supports')
      .orderBy('supports.createdAt', query.order)
      .where('supports.customerId = :userId', { userId })
      .paginate(query);

    const dtos = this._mapper.mapArray(items, SupportEntity, SupportDto);
    return dtos.toPagination(meta);
  }

  public async getSupport(id: string): Promise<SupportDto> {
    const userId = this._req?.user?.id;
    if (!userId) throw new ForbiddenException();

    const entity = await this._supportRepository.findOne({
      where: { id, customerId: userId },
    });
    if (!entity) throw new BadRequestException();

    return this._mapper.map(entity, SupportEntity, SupportDto);
  }

  public async update(
    nflowId: string,
    dto: UpdateSupportRequestDto,
  ): Promise<boolean> {
    const entity = await this._supportRepository.findOneBy({ nflowId });
    if (!entity) throw new BadRequestException(W24Error.NotFound('Support'));

    try {
      entity.status = dto.status;

      if (dto.supportResponse) {
        entity.data = { ...entity.data, supportResponse: dto.supportResponse };
      }

      const support = await this._supportRepository.save(entity);
      this._emitter.emit(EVENT.SUPPORT.NOTIFICATION, support);

      if (dto.status === SupportStatus.IN_PROGRESS) {
        this.updateSupportChatUrl(entity.id);
      }

      return true;
    } catch (error) {
      this._logger.error(error);
      throw new BadRequestException(error);
    }
  }

  public async updateSupportChatUrl(supportId: string): Promise<boolean> {
    try {
      const support = await this._supportRepository.findOneBy({
        id: supportId,
        status: SupportStatus.IN_PROGRESS,
      });
      if (!support) return false;

      const user = await this._dataSource.getRepository(UserEntity).findOneBy({
        id: support.customerId,
      });
      if (!user) return false;

      const dto = this._mapper.map(user, UserEntity, UserDto);

      // Build chatwoot contact url
      const chatUrl = await this._chatwoot.buildContactUrl(support, dto);
      if (!chatUrl) return false;

      const data: SupportDataDto = { ...support.data, supportChatUrl: chatUrl };

      // Update support chat url
      await this._supportRepository.update(support.id, {
        data,
      });

      // Sync support chat url to nflow
      await this._nflow.sync({
        type: SyncTypeEnum.SUPPORT,
        action: SyncActionEnum.Sync,
        data: { supportChatUrl: chatUrl },
        nflowId: support.nflowId,
      });

      return true;
    } catch (error) {
      this._logger.error(error);
      return false;
    }
  }
}
