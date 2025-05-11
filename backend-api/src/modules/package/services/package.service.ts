import { Mapper } from '@automapper/core';
import { InjectMapper } from '@automapper/nestjs';
import { InjectQueue } from '@nestjs/bull';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Queue } from 'bull';
import dayjs from 'dayjs';
import { DataSource, Repository } from 'typeorm';

import { getUtcNow, normalizeEmail } from '../../../common/utils';
import { CACHE_KEY, EVENT, QUEUE } from '../../../constants';
import { SyncActionEnum } from '../../../constants/action';
import {
  DEFAULT_TIMEZONE,
  VOUCHER_CREATE_ATTEMPT_LIMIT,
  VOUCHER_USAGE_DURATION,
} from '../../../constants/config';
import { W24Error } from '../../../constants/error-code';
import { ApiConfigService } from '../../../shared/services/api-config.service';
import { CacheService } from '../../../shared/services/cache.service';
import { LoggerService } from '../../../shared/services/logger.service';
import { TranslationService } from '../../../shared/services/translation.service';
import { VoucherService } from '../../../shared/services/voucher.service';
import { NflowService } from '../../nflow/services/nflow.service';
import { CreateVoucherDto } from '../../order/dtos/create-voucher.dto';
import { EventValidityDto, VoucherDto } from '../../order/dtos/voucher.dto';
import { OrderEntity } from '../../order/entities/order.entity';
import { OrderItemEntity } from '../../order/entities/order-item.entity';
import { OrderStatusEnum } from '../../order/enums/order-status.enum';
import { OrderTypeEnum } from '../../order/enums/order-type.enum';
import {
  VoucherIssueTypeEnum,
  VoucherModelEnum,
  VoucherProfileApplicationEnum,
  VoucherStatusEnum,
  VoucherTypeEnum,
} from '../../order/enums/vouchers.enum';
import { ProductTypeEnum } from '../../product/enums/products.enum';
import { NflowPackageDto } from '../dtos/nflow-package.dto';
import { PackageDto, PackageVoucherDto } from '../dtos/package.dto';
import { PackageVoucherEntity } from '../entities/package-voucher.entity';
import { WashPackageStatus } from '../enums/voucher-package-status.enum';
import { PackageUtils } from './package.utils';

@Injectable()
export class PackageService {
  private readonly _voucherPkgRepo: Repository<PackageVoucherEntity>;

  constructor(
    @InjectQueue(QUEUE.PACKAGE.PROCESS)
    private readonly _queue: Queue<string>,
    @InjectQueue(QUEUE.PACKAGE.RETRY)
    private readonly _retryQueue: Queue<string>,
    @InjectMapper() private readonly _mapper: Mapper,
    @Inject(REQUEST) private readonly _req: any,
    private readonly _cache: CacheService,
    private readonly _logger: LoggerService,
    private readonly _nflow: NflowService,
    private readonly _dataSource: DataSource,
    private readonly _voucherService: VoucherService,
    private readonly _emitter: EventEmitter2,
    private readonly _i18n: TranslationService,
    private readonly _config: ApiConfigService,
  ) {
    this._voucherPkgRepo = this._dataSource.getRepository(PackageVoucherEntity);
  }

  public async getPackages(): Promise<PackageDto[]> {
    try {
      const cache = await this.getCachedPackages();
      if (cache) return cache;

      const pkgs = await this.getNflowPackages();
      if (pkgs?.length) {
        await this._cache.set(CACHE_KEY.PACKAGES, pkgs);
      }

      return pkgs;
    } catch (error) {
      await this._cache.delete(CACHE_KEY.PACKAGES);
      this._logger.error(error);
      return [];
    }
  }

  public async getPublishPackages(): Promise<PackageDto[]> {
    try {
      const email = this._req?.user?.email;
      if (!email) return [];

      const blacklist = this._config.packageBlacklist;
      if (blacklist?.length && blacklist.includes(normalizeEmail(email))) {
        return [];
      }

      const pkgs = await this.getPackages();
      return pkgs?.filter((pkg) => PackageUtils.canAccessPackage(pkg, email));
    } catch (error) {
      this._logger.error(error);
      return [];
    }
  }

  public async getNflowPackages(): Promise<PackageDto[]> {
    try {
      const data = await this._nflow.search<NflowPackageDto>(
        NflowService.PACKAGE,
      );

      return this._mapper.mapArray(data || [], NflowPackageDto, PackageDto);
    } catch (error) {
      this._logger.error(error);
      return [];
    }
  }

  public async getPackage(guid: string): Promise<PackageDto> {
    try {
      const pkgs = await this.getPackages();
      return pkgs.find((pkg) => pkg.guid === guid);
    } catch (error) {
      this._logger.error(error);
      return null;
    }
  }

  public async syncPackages(dto: PackageDto): Promise<boolean> {
    try {
      await this._cache.delete(CACHE_KEY.PACKAGES);
      this._logger.info(`[Package] Syncing package: ${dto.guid}`);

      const pkgs = await this.getNflowPackages();
      await this._cache.set(CACHE_KEY.PACKAGES, pkgs || []);

      return true;
    } catch (error) {
      this._logger.error(error);
      return false;
    }
  }

  public async deletePackage(id: string): Promise<boolean> {
    const pkgs = await this.getCachedPackages();
    if (!pkgs) return true;

    const filterPkgs = pkgs.filter((pkg) => pkg.guid !== id);
    await this._cache.set(CACHE_KEY.PACKAGES, filterPkgs);
    return true;
  }

  private async getCachedPackages(): Promise<PackageDto[]> {
    try {
      return this._cache.get<PackageDto[]>(CACHE_KEY.PACKAGES) || [];
    } catch (error) {
      this._logger.error(error);
      return [];
    }
  }

  public async processPackageOrder(orderId: string): Promise<void> {
    const order = await this._dataSource.getRepository(OrderEntity).findOneBy({
      id: orderId,
      type: OrderTypeEnum.PACKAGE,
      status: OrderStatusEnum.PENDING,
    });
    if (!order) {
      throw new BadRequestException(W24Error.NotFound('Order'));
    }

    let isCompleted = false;

    try {
      const item = await this._dataSource
        .getRepository(OrderItemEntity)
        .findOneBy({
          orderId: order.id,
          productType: ProductTypeEnum.PACKAGE,
        });
      if (!item) {
        throw new BadRequestException(W24Error.NotFound('Item'));
      }

      this._logger.log(`[Package] Processing package order: ${orderId}`);
      isCompleted = await this.createPackageVouchers(item.productId, order);
    } catch (error) {
      this._logger.error(error);
      isCompleted = false;
    }

    if (!isCompleted) {
      await this.failPackageOrder(orderId);
    }
  }

  private async createPackageVouchers(
    packageId: string,
    order: OrderEntity,
  ): Promise<boolean> {
    try {
      const pkg = await this.getPackage(packageId);
      if (!pkg) {
        throw new BadRequestException(W24Error.NotFound('Package'));
      }

      let excludedTimes: EventValidityDto[] = [];
      if (pkg.event?.length) {
        excludedTimes = await this._nflow.getEvents(pkg.event);
      }

      const validVouchers = (pkg.vouchers || [])?.filter((i) => i.quantity > 0);
      if (!validVouchers.length) {
        throw new BadRequestException(W24Error.NotFound('Voucher'));
      }

      const generatedVouchers: Array<Partial<PackageVoucherEntity>> =
        validVouchers.flatMap((voucherConfig) => {
          const voucher: Partial<PackageVoucherEntity> = {
            orderId: order.id,
            packageId: pkg.guid,
            stationIds: pkg.stationIds,
            usageDuration: pkg.usageDuration,
            status: WashPackageStatus.PENDING,
            voucher: {
              name: voucherConfig.name,
              description: voucherConfig.description,
              value: voucherConfig.value,
              excludeTimes: excludedTimes,
            },
          };

          return Array.from({ length: voucherConfig.quantity }, () => voucher);
        });

      await this._voucherPkgRepo.save(generatedVouchers);

      this._logger.log(`[Package] Package vouchers generated: ${order.id}`);
      this._queue.add(QUEUE.PACKAGE.PROCESS, order.id);

      return true;
    } catch (error) {
      this._logger.error(error);
      throw new BadRequestException(error);
    }
  }

  public async handleCreateVouchers(orderId: string): Promise<boolean> {
    this._logger.log(`[Package] Creating vouchers for order: ${orderId}`);
    const order = await this._dataSource.getRepository(OrderEntity).findOneBy({
      id: orderId,
      status: OrderStatusEnum.PENDING,
      type: OrderTypeEnum.PACKAGE,
    });

    if (!order) return true;

    const packages = await this._voucherPkgRepo.findBy({ orderId });
    if (!packages?.length) return true;

    const isAllCompleted = packages.every(
      (e) => e.status === WashPackageStatus.COMPLETED,
    );
    if (isAllCompleted) {
      await this.completePackageOrder(orderId);
      return true;
    }

    const isAllExpired = packages.every(
      (e) => e.attempt >= VOUCHER_CREATE_ATTEMPT_LIMIT,
    );
    if (isAllExpired) {
      await this.failPackageOrder(orderId);
      return true;
    }

    const pendingPackages = packages.filter(
      (pkg) => pkg.status !== WashPackageStatus.COMPLETED,
    );
    if (!pendingPackages.length) return true;

    const isCompleted = await this.createVouchers(order, pendingPackages);
    if (isCompleted) {
      await this.completePackageOrder(orderId);
    } else {
      await this.addRetryJob(orderId);
    }

    return isCompleted;
  }

  private async createVouchers(
    order: OrderEntity,
    pkgs: PackageVoucherEntity[],
  ): Promise<boolean> {
    if (!pkgs?.length) return true;

    let vouchers: VoucherDto[] = [];

    try {
      const voucherRequests = pkgs.map((pkg) => this.buildVoucher(pkg, order));
      vouchers = await this._voucherService.createBulkVouchers(voucherRequests);
    } catch (error) {
      this._logger.error(error);
    }

    const packages = pkgs.map((pkg, index) => {
      const voucher = vouchers[index];
      const config = this.buildVoucherConfig(voucher);

      return {
        ...pkg,
        status: voucher
          ? WashPackageStatus.COMPLETED
          : WashPackageStatus.FAILED,
        attempt: pkg.attempt + 1,
        voucher: config ?? pkg.voucher,
        voucherId: voucher?.id,
      };
    });

    try {
      const entities = await this._dataSource
        .getRepository(PackageVoucherEntity)
        .save(packages);

      return entities.every((e) => e.status === WashPackageStatus.COMPLETED);
    } catch (error) {
      this._logger.error(error);
      return false;
    }
  }

  private buildVoucher(
    pkg: PackageVoucherEntity,
    order: OrderEntity,
  ): CreateVoucherDto {
    const now = getUtcNow();
    const duration = pkg.usageDuration || VOUCHER_USAGE_DURATION;

    const endDate = dayjs(now).add(duration, 'day');
    const formattedEndDate = endDate.tz(DEFAULT_TIMEZONE).format('DD/MM/YYYY');

    const endDateMsg = this._i18n.translate('common.voucher.endDate', {
      args: { endAt: formattedEndDate },
    });

    const description = pkg.voucher?.description || '';

    return {
      name: pkg.voucher?.name || '',
      description: (description.length ? `${description}\n` : '') + endDateMsg,
      type: VoucherTypeEnum.WASHING_SERVICE,
      profileApplication: VoucherProfileApplicationEnum.WASHING_SERVICE,
      voucherModel: VoucherModelEnum.PERCENTAGE,
      minOrderValue: 0,
      maxDeductionValue: pkg.voucher?.value,
      hiddenCashValue: pkg.voucher?.value,
      percentage: 100,
      location: {
        stationIds: pkg.stationIds,
        deviceIds: [],
        isExcluded: true,
      },
      status: VoucherStatusEnum.AVAILABLE,
      userId: order.customerId,
      email: order.customerEmail,
      startAt: now,
      endAt: endDate.toDate(),
      excludeTime: pkg.voucher?.excludeTimes,
      data: {
        packageId: pkg.packageId,
        orderPackageId: pkg.orderId,
      },
      issueType: VoucherIssueTypeEnum.PACKAGE,
    };
  }

  private buildVoucherConfig(voucher: VoucherDto): PackageVoucherDto {
    if (!voucher) return;

    return {
      name: voucher.name,
      description: voucher.description,
      value: voucher.maxDeductionValue,
    };
  }

  private async completePackageOrder(orderId: string): Promise<void> {
    const result = await this._dataSource.getRepository(OrderEntity).update(
      {
        id: orderId,
        status: OrderStatusEnum.PENDING,
        type: OrderTypeEnum.PACKAGE,
      },
      {
        status: OrderStatusEnum.COMPLETED,
      },
    );
    if (!result?.affected) return;

    this._emitter.emit(EVENT.ORDER.COMPLETED, orderId);
    this._emitter.emit(EVENT.SYNC.ORDER, {
      action: SyncActionEnum.Sync,
      id: orderId,
    });
  }

  private async failPackageOrder(orderId: string): Promise<void> {
    const result = await this._dataSource.getRepository(OrderEntity).update(
      {
        id: orderId,
        status: OrderStatusEnum.PENDING,
        type: OrderTypeEnum.PACKAGE,
      },
      {
        status: OrderStatusEnum.FAILED,
      },
    );
    if (!result?.affected) return;

    this._emitter.emit(EVENT.SYNC.ORDER, {
      action: SyncActionEnum.Sync,
      id: orderId,
    });
    this._emitter.emit(EVENT.ORDER.REFUND, orderId);
  }

  private async addRetryJob(orderId: string): Promise<void> {
    const job = await this._retryQueue.add(QUEUE.PACKAGE.RETRY, orderId);
    this._logger.log(`[Package] Retry job added: ${job.id}`);
  }
}
