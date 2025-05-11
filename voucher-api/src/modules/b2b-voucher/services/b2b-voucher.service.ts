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
import dayjs from 'dayjs';
import { DataSource, IsNull, Repository } from 'typeorm';

import { getUtcNow } from '../../../common/utils';
import { CACHE_KEY, EVENT } from '../../../constants';
import { W24Error } from '../../../constants/error-code';
import { CreateB2bInvoiceRequestDto } from '../../../shared/dtos/issue-b2b-invoice.request.dto';
import { BeAPIService } from '../../../shared/services/be-api.service';
import { CacheService } from '../../../shared/services/cache.service';
import { LoggerService } from '../../../shared/services/logger.service';
import { NflowService } from '../../nflow/services/nflow.service';
import { CreateVoucherDto } from '../../voucher/dtos/requests/create-voucher.dto';
import { VoucherDto } from '../../voucher/dtos/voucher.dto';
import {
  VoucherIssueTypeEnum,
  VoucherModelEnum,
  VoucherProfileApplicationEnum,
  VoucherStatusEnum,
  VoucherTypeEnum,
} from '../../voucher/enums/vouchers.enum';
import { VoucherService } from '../../voucher/services/voucher.service';
import { B2bVoucherDto } from '../dtos/b2b-voucher.dto';
import { CreateB2bVoucherDto } from '../dtos/requests/create-b2b-voucher.dto';
import { UpdateB2bVoucherDto } from '../dtos/requests/update-b2b-voucher.dto';
import { B2bVoucherEntity } from '../entities/b2b-voucher.entity';
import { B2bVoucherCodeEntity } from '../entities/b2b-voucher-code.entity';
import { B2bVoucherStatus } from '../enums/b2b-voucher.enum';
import { B2bVoucherCodeStatus } from '../enums/b2b-voucher-code.enum';

@Injectable()
export class B2bVoucherService {
  private readonly _b2bVoucherRepository: Repository<B2bVoucherEntity>;
  private readonly _b2bVoucherCodeRepository: Repository<B2bVoucherCodeEntity>;

  constructor(
    @InjectMapper() private readonly _mapper: Mapper,
    @Inject(REQUEST) private readonly _req: any,
    private readonly _dataSource: DataSource,
    private readonly _logger: LoggerService,
    private readonly _voucher: VoucherService,
    private readonly _emitter: EventEmitter2,
    private readonly _nflow: NflowService,
    private readonly _beService: BeAPIService,
    private readonly _cache: CacheService,
  ) {
    this._b2bVoucherRepository =
      this._dataSource.getRepository(B2bVoucherEntity);
    this._b2bVoucherCodeRepository =
      this._dataSource.getRepository(B2bVoucherCodeEntity);
  }

  async create(dto: CreateB2bVoucherDto): Promise<B2bVoucherDto> {
    try {
      const entity = this._mapper.map(
        dto,
        CreateB2bVoucherDto,
        B2bVoucherEntity,
      );

      const savedEntity = await this._b2bVoucherRepository.save(entity);

      this._emitter.emit(EVENT.B2B_VOUCHER.CREATED, savedEntity.id);

      return this._mapper.map(savedEntity, B2bVoucherEntity, B2bVoucherDto);
    } catch (error) {
      this._logger.error(error);
      throw new BadRequestException(error);
    }
  }

  async redeemCode(code: string): Promise<VoucherDto> {
    const userId: string = this._req?.user?.id;
    if (!userId) throw new ForbiddenException();

    const lockAcquired = await this._cache.get(CACHE_KEY.B2B_REDEEM_CODE(code));
    if (lockAcquired) {
      throw new BadRequestException(W24Error.ToManyRequests);
    }

    await this._cache.set(CACHE_KEY.B2B_REDEEM_CODE(code), true, 60 * 3);

    try {
      const voucherCode = await this._b2bVoucherCodeRepository.findOneBy({
        code,
        status: B2bVoucherCodeStatus.AVAILABLE,
        voucherId: IsNull(),
      });

      if (!voucherCode) {
        throw new BadRequestException(W24Error.VoucherCodeInvalid);
      }

      const b2bVoucher = await this._b2bVoucherRepository.findOne({
        where: { id: voucherCode.b2bVoucherId },
      });

      if (!b2bVoucher) {
        throw new BadRequestException(W24Error.VoucherCodeInvalid);
      }

      const now = getUtcNow();
      if (b2bVoucher.startAt && dayjs(b2bVoucher.startAt).isAfter(now)) {
        throw new BadRequestException(W24Error.VoucherCodeNotActiveYet);
      }

      if (b2bVoucher.endAt && dayjs(b2bVoucher.endAt).isBefore(now)) {
        throw new BadRequestException(W24Error.VoucherCodeExpired);
      }

      const request: CreateVoucherDto = {
        name: b2bVoucher.voucherName,
        description: b2bVoucher.voucherDescription,
        type: VoucherTypeEnum.WASHING_SERVICE,
        profileApplication: VoucherProfileApplicationEnum.WASHING_SERVICE,
        voucherModel: VoucherModelEnum.PERCENTAGE,
        minOrderValue: 0,
        percentage: b2bVoucher.percentage,
        startAt: b2bVoucher.startAt,
        endAt: b2bVoucher.endAt,
        status: VoucherStatusEnum.AVAILABLE,
        location: b2bVoucher.location,
        userId,
        email: this._req?.user?.email,
        data: {
          b2bVoucherId: b2bVoucher.id,
          b2bVoucherCode: voucherCode.code,
        },
        excludeTime: b2bVoucher.validity?.excludeTimes,
        issueType: VoucherIssueTypeEnum.B2B,
        washModes: b2bVoucher.validity?.washModes,
      };

      const voucher = await this._voucher.createByApp(request);
      if (!voucher) {
        throw new BadRequestException(W24Error.UnexpectedError);
      }

      const result = await this._b2bVoucherCodeRepository.update(
        voucherCode.id,
        {
          voucherId: voucher.id,
          status: B2bVoucherCodeStatus.REDEEMED,
          redeemedAt: getUtcNow(),
          redeemedBy: userId,
        },
      );

      const isRedeemed = result.affected > 0;
      if (isRedeemed) {
        this._emitter.emit(EVENT.SYNC.B2B_VOUCHER_CODE, voucherCode.id);
      }

      return voucher;
    } catch (error) {
      this._logger.error(error);
      throw new BadRequestException(error);
    } finally {
      await this._cache.delete(CACHE_KEY.B2B_REDEEM_CODE(code));
    }
  }

  async recallCode(b2bVoucherId: string): Promise<boolean> {
    try {
      const b2bVoucher = await this._b2bVoucherRepository.findOneBy({
        id: b2bVoucherId,
        status: B2bVoucherStatus.COMPLETED,
      });

      if (!b2bVoucher) {
        throw new BadRequestException(W24Error.NotFound('B2B Voucher'));
      }

      const result = await this._b2bVoucherCodeRepository.update(
        {
          b2bVoucherId: b2bVoucherId,
          status: B2bVoucherCodeStatus.AVAILABLE,
          voucherId: IsNull(),
        },
        {
          status: B2bVoucherCodeStatus.RECALLED,
        },
      );

      const isRecalled = result?.affected > 0;
      if (isRecalled) {
        this._emitter.emit(EVENT.B2B_VOUCHER.RECALLED, b2bVoucherId);
      }

      return isRecalled;
    } catch (error) {
      this._logger.error(error);
      throw new BadRequestException(error);
    }
  }

  async update(id: string, dto: UpdateB2bVoucherDto): Promise<boolean> {
    try {
      const entity = await this._b2bVoucherRepository.findOneBy({ id });
      if (!entity) {
        throw new BadRequestException(W24Error.NotFound('B2B Voucher'));
      }

      const result = await this._b2bVoucherRepository.update(id, dto);
      return result.affected > 0;
    } catch (error) {
      this._logger.error(error);
      throw new BadRequestException(error);
    }
  }

  async issueInvoice(b2bVoucherId: string): Promise<boolean> {
    try {
      const b2bVoucher = await this._b2bVoucherRepository.findOne({
        where: {
          id: b2bVoucherId,
          status: B2bVoucherStatus.COMPLETED,
        },
        relations: ['invoice'],
      });

      if (!b2bVoucher) {
        throw new BadRequestException(W24Error.NotFound('B2B Voucher'));
      }

      return this.handleIssueInvoice(b2bVoucher);
    } catch (error) {
      this._logger.error(error);
      throw new BadRequestException(error);
    }
  }

  async handleIssueInvoice(b2bVoucher: B2bVoucherEntity): Promise<boolean> {
    const b2bInvoice = b2bVoucher.invoice;
    if (!b2bInvoice) return false;

    try {
      const request: CreateB2bInvoiceRequestDto = {
        orderId: b2bVoucher.id,
        orderIncrementId: b2bVoucher.incrementId,
        invoiceBilling: {
          code: b2bInvoice.code,
          name: b2bInvoice.name,
          address: b2bInvoice.address,
          billingName: b2bInvoice.billingName,
        },
        items: b2bInvoice.items.map((item) => ({
          name: item.name,
          price: item.price,
          unit: item.unit,
          qty: 1,
        })),
      };

      const invoice = await this._beService.issueB2bInvoice(request);
      const invoiceUrl =
        invoice?.data?.['Data']?.['Invoices']?.[0]?.['LinkView'];
      if (!invoiceUrl) {
        this._logger.error(
          `[B2B Voucher] Invoice for voucher ${b2bVoucher.id} not found`,
        );
        return false;
      }

      await this.syncInvoiceURL(b2bVoucher.id, invoiceUrl);
      return true;
    } catch (error) {
      this._logger.error(error);
      throw new BadRequestException(error);
    }
  }

  private async syncInvoiceURL(b2bVoucherId: string, invoiceUrl: string) {
    const guid = await this._nflow.getGuid(NflowService.B2B_VOUCHER, {
      id: b2bVoucherId,
    });

    if (!guid) {
      this._logger.error(
        `[B2B Voucher] Guid for voucher ${b2bVoucherId} not found`,
      );
      return;
    }

    await this._nflow.request({
      method: 'PUT',
      path: `${NflowService.B2B_VOUCHER}/${guid}`,
      data: {
        invoiceUrl,
      },
    });
  }
}
