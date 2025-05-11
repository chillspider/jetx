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
import { InjectRepository } from '@nestjs/typeorm';
import dayjs from 'dayjs';
import { mergeWith } from 'lodash';
import type {
  DeleteResult,
  FindOptionsWhere,
  SelectQueryBuilder,
  UpdateResult,
} from 'typeorm';
import {
  Brackets,
  IsNull,
  LessThanOrEqual,
  MoreThanOrEqual,
  Repository,
} from 'typeorm';
import { v4 as uuid } from 'uuid';

import { MyVouchersPaginationRequestDto } from '../../../common/dto/my-vouchers-pagination-request.dto';
import { PaginationRequestDto } from '../../../common/dto/pagination-request.dto';
import { PaginationResponseDto } from '../../../common/dto/pagination-response.dto';
import { getUtcNow } from '../../../common/utils';
import { EVENT, Order, SyncActionEnum } from '../../../constants';
import { W24Error } from '../../../constants/error-code';
import { VoucherNotFoundException } from '../../../exceptions/voucher-not-found.exception';
import { LoggerService } from '../../../shared/services/logger.service';
import { NflowService } from '../../nflow/services/nflow.service';
import { SyncVoucherDto } from '../../sync/dtos/sync-voucher.dto';
import { SyncTypeEnum } from '../../sync/enums/sync-action.enum';
import { CreateVoucherDto } from '../dtos/requests/create-voucher.dto';
import { UpdateVoucherDto } from '../dtos/requests/update-voucher.dto';
import { UseVoucherDto } from '../dtos/requests/use-voucher.dto';
import { VoucherDto } from '../dtos/voucher.dto';
import { VoucherMetadataDto } from '../dtos/voucher-metadata.dto';
import { VoucherEntity } from '../entities/voucher.entity';
import { VoucherModelEnum, VoucherStatusEnum } from '../enums/vouchers.enum';

@Injectable()
export class VoucherService {
  constructor(
    @InjectMapper() private readonly _mapper: Mapper,
    @InjectRepository(VoucherEntity)
    private _voucherRepository: Repository<VoucherEntity>,
    @Inject(REQUEST) private readonly _req: any,
    private readonly _emitter: EventEmitter2,
    private readonly _nflow: NflowService,
    private readonly _logger: LoggerService,
  ) {}

  public async findOne(
    findData: FindOptionsWhere<VoucherEntity>,
  ): Promise<VoucherDto> {
    const entity: VoucherEntity | null =
      await this._voucherRepository.findOneBy(findData);

    return this._mapper.map(entity, VoucherEntity, VoucherDto);
  }

  public async getVouchers(
    query: PaginationRequestDto,
  ): Promise<PaginationResponseDto<VoucherDto>> {
    const queryBuilder: SelectQueryBuilder<VoucherEntity> =
      this._voucherRepository.createQueryBuilder('vouchers');

    const [items, meta] = await queryBuilder.paginate(query);

    const dtos: VoucherDto[] = this._mapper.mapArray(
      items,
      VoucherEntity,
      VoucherDto,
    );

    return dtos.toPagination(meta);
  }

  public async getMyVouchers(
    query: MyVouchersPaginationRequestDto,
  ): Promise<PaginationResponseDto<VoucherDto>> {
    const userId: string = this._req?.user?.id;
    if (!userId) throw new ForbiddenException();

    const { orderValue, isShowExpiredVouchers } = query;
    const now = getUtcNow();
    const sevenDaysAgo = dayjs(now).subtract(7, 'day').toDate();

    const builder = this._voucherRepository
      .createQueryBuilder('vouchers')
      .where({ userId, status: VoucherStatusEnum.AVAILABLE })
      .andWhere(
        new Brackets((qb) => {
          qb.where([{ startAt: LessThanOrEqual(now) }, { startAt: IsNull() }]);
        }),
      )
      .andWhere(
        new Brackets((qb) => {
          qb.where([{ endAt: MoreThanOrEqual(now) }, { endAt: IsNull() }]);
          if (isShowExpiredVouchers) {
            qb.orWhere({ endAt: MoreThanOrEqual(sevenDaysAgo) });
          }
        }),
      );

    if (orderValue) {
      builder
        .andWhere('vouchers.min_order_value <= :orderValue', { orderValue })
        .addSelect(
          `
          CASE
            WHEN vouchers.voucher_model = '${VoucherModelEnum.FIXED_AMOUNT}'
              THEN vouchers.hidden_cash_value
            WHEN vouchers.voucher_model = '${VoucherModelEnum.PERCENTAGE}'
              THEN CASE
                WHEN vouchers.max_deduction_value IS NOT NULL
                  THEN LEAST((vouchers.percentage * ${orderValue / 100}), vouchers.max_deduction_value)
                ELSE (vouchers.percentage * ${orderValue / 100})
              END
            ELSE vouchers.hidden_cash_value
          END AS deduction`,
        )
        .orderBy('deduction', Order.DESC);
    } else {
      builder.orderBy('vouchers.hidden_cash_value', Order.DESC);
    }

    builder.addOrderBy('vouchers.end_at', Order.ASC);

    const [items, meta] = await builder.paginate(query, { raw: true });

    const dtos: VoucherDto[] = this._mapper.mapArray(
      items,
      VoucherEntity,
      VoucherDto,
    );

    return dtos.toPagination(meta);
  }

  public async useMyVoucher(id: string, req: UseVoucherDto): Promise<boolean> {
    const userId: string = this._req?.user?.id;
    if (!userId) throw new ForbiddenException();

    const currentVoucher = await this._voucherRepository
      .createQueryBuilder('v')
      .where({
        id,
        status: VoucherStatusEnum.AVAILABLE,
        userId,
      })
      .andWhere([
        { startAt: LessThanOrEqual(getUtcNow()) },
        { startAt: IsNull() },
      ])
      .andWhere([{ endAt: MoreThanOrEqual(getUtcNow()) }, { endAt: IsNull() }])
      .getOne();
    if (!currentVoucher) throw new VoucherNotFoundException();

    const data = this._mergeMetadata(currentVoucher.data, req.data);

    const result: UpdateResult = await this._voucherRepository.update(
      { id },
      { status: VoucherStatusEnum.USED, orderId: req.orderId, data: data },
    );

    if (result) {
      this._emitter.emit(EVENT.SYNC.VOUCHER, currentVoucher.id);
      this._emitter.emit(EVENT.B2B_VOUCHER.USED, currentVoucher.id);
    }

    return !!result.affected;
  }

  public async createByApp(dto: CreateVoucherDto): Promise<VoucherDto> {
    try {
      const entity: VoucherEntity = this._mapper.map(
        dto,
        CreateVoucherDto,
        VoucherEntity,
      );
      entity.id = uuid();

      const syncDto = this._mapper.map(dto, CreateVoucherDto, SyncVoucherDto);
      syncDto.id = entity.id;
      syncDto.voucherId = entity.id;

      const guid = await this._nflow.sync({
        type: SyncTypeEnum.VOUCHER,
        action: SyncActionEnum.Sync,
        data: syncDto,
      });

      if (!guid || typeof guid !== 'string') {
        throw new BadRequestException(W24Error.UnexpectedError);
      }

      entity.nflowId = guid;
      const result = await this._voucherRepository.save(entity);

      return this._mapper.map(result, VoucherEntity, VoucherDto);
    } catch (error) {
      this._logger.error(error);
      throw new BadRequestException(error);
    }
  }

  public async createBulkByApp(
    batchVouchers: CreateVoucherDto[],
  ): Promise<VoucherDto[]> {
    try {
      const vouchers = await this.createBulk(batchVouchers);

      this._emitter.emit(
        EVENT.SYNC.VOUCHER_BATCH,
        vouchers.map((v) => v.id),
      );

      return vouchers;
    } catch (error) {
      this._logger.error(error);
      throw new BadRequestException(error);
    }
  }

  public async create(dto: CreateVoucherDto): Promise<VoucherDto> {
    const entity: VoucherEntity = this._mapper.map(
      dto,
      CreateVoucherDto,
      VoucherEntity,
    );

    const voucher: VoucherEntity = await this._voucherRepository.save(entity);

    return this._mapper.map(voucher, VoucherEntity, VoucherDto);
  }

  public async createBulk(
    batchVouchers: CreateVoucherDto[],
  ): Promise<VoucherDto[]> {
    const entities: VoucherEntity[] = this._mapper.mapArray(
      batchVouchers,
      CreateVoucherDto,
      VoucherEntity,
    );
    const vouchers = await this._voucherRepository.save(entities);

    return this._mapper.mapArray(vouchers, VoucherEntity, VoucherDto);
  }

  public async update(dto: UpdateVoucherDto): Promise<boolean> {
    const currentVoucher: VoucherDto = await this.findOne({
      id: dto.id,
    });
    if (!currentVoucher) throw new VoucherNotFoundException();

    const updateEntity: VoucherEntity = this._mapper.map(
      dto,
      UpdateVoucherDto,
      VoucherEntity,
    );
    updateEntity.data = this._mergeMetadata(currentVoucher.data, dto.data);

    const result = await this._voucherRepository.save(updateEntity);
    return !!result;
  }

  public async delete(id: string): Promise<boolean> {
    const currentVoucher: VoucherDto = await this.findOne({
      id,
    });

    if (!currentVoucher) throw new VoucherNotFoundException();

    const isDeleted: DeleteResult = await this._voucherRepository.delete(id);

    return !!isDeleted.affected;
  }

  public async rollbackVoucher(id: string): Promise<boolean> {
    const currentVoucher: VoucherDto = await this.findOne({
      id,
      status: VoucherStatusEnum.USED,
    });
    if (!currentVoucher) throw new VoucherNotFoundException();

    const data = this._mergeMetadata(currentVoucher.data, {
      stationId: null,
      stationName: null,
      orderIncrementId: null,
      orderCreatedAt: null,
    });

    const result: UpdateResult = await this._voucherRepository.update(
      { id },
      { status: VoucherStatusEnum.AVAILABLE, orderId: null, data: data },
    );

    if (result) {
      this._emitter.emit(EVENT.SYNC.VOUCHER, currentVoucher.id);
      this._emitter.emit(EVENT.B2B_VOUCHER.ROLLBACK, currentVoucher.id);
    }

    return !!result?.affected;
  }

  private _mergeMetadata(
    data: VoucherMetadataDto,
    request: VoucherMetadataDto,
  ): VoucherMetadataDto {
    return mergeWith({}, data || {}, request || {}, (objValue, srcValue) => {
      return srcValue === undefined ? objValue : srcValue;
    });
  }
}
