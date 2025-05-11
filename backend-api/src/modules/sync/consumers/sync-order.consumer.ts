import { Mapper } from '@automapper/core';
import { InjectMapper } from '@automapper/nestjs';
import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { DataSource, Not } from 'typeorm';

import { getUtcNow } from '../../../common/utils';
import { QUEUE } from '../../../constants';
import { SyncActionEnum } from '../../../constants/action';
import { LoggerService } from '../../../shared/services/logger.service';
import { NflowService } from '../../nflow/services/nflow.service';
import { OrderEntity } from '../../order/entities/order.entity';
import { OrderItemEntity } from '../../order/entities/order-item.entity';
import { OrderStatusEnum } from '../../order/enums/order-status.enum';
import { PackageVoucherEntity } from '../../package/entities/package-voucher.entity';
import { WashPackageStatus } from '../../package/enums/voucher-package-status.enum';
import { OrderTransactionEntity } from '../../payment/entities/order-transaction.entity';
import { TransactionStatus } from '../../payment/enums/transaction-status.enum';
import { InvoiceEntity } from '../../tax/entities/invoice.entity';
import { InvoiceStatusEnum } from '../../tax/enums/invoice-status.enum';
import { SyncRequestDto } from '../dtos/requests/sync.request.dto';
import { SyncLogDto } from '../dtos/sync-log.dto';
import { SyncOrderDto } from '../dtos/sync-order.dto';
import { SyncOrderItemDto } from '../dtos/sync-order-item.dto';
import { SyncOrderTransactionDto } from '../dtos/sync-order-transaction.dto';
import { SyncTypeEnum } from '../enums/sync-action.enum';
import { SyncService } from '../services/sync.service';

@Processor(QUEUE.SYNC.ORDER)
export class SyncOrderConsumer {
  constructor(
    @InjectMapper() private readonly _mapper: Mapper,
    private readonly _nflow: NflowService,
    private readonly _dataSource: DataSource,
    private readonly _syncService: SyncService,
    private readonly _logger: LoggerService,
  ) {}

  @Process({
    name: SyncTypeEnum.ORDER,
    concurrency: 1,
  })
  async handleSyncOrder(job: Job<SyncRequestDto>): Promise<void> {
    const data = job.data;
    if (!data) return;

    this._logger.info(`[SYNC ORDER] Start ${data.id}`);

    const entity = await this._dataSource.getRepository(OrderEntity).findOneBy({
      id: data.id,
      status: Not(OrderStatusEnum.DRAFT),
    });
    if (!entity) return;

    const [items, transactions] = await Promise.all([
      this._dataSource.getRepository(OrderItemEntity).findBy({
        orderId: entity.id,
      }),
      this._dataSource.getRepository(OrderTransactionEntity).findBy({
        orderId: entity.id,
        status: Not(TransactionStatus.DRAFT),
      }),
    ]);

    const isSynced = await this.syncOrder(data.action, entity);
    if (!isSynced) return;

    if (items?.length) {
      await Promise.all(
        items.map((item) => this.syncOrderItem(data.action, item)),
      );
    }

    if (transactions?.length) {
      await Promise.all(
        transactions.map((transaction) =>
          this.syncOrderTransaction(
            data.action,
            transaction,
            entity.data?.stationId,
          ),
        ),
      );
    }

    this._logger.info(`[SYNC ORDER] Done ${data.id}`);
  }

  @Process({
    name: SyncTypeEnum.ORDER_ITEM,
    concurrency: 1,
  })
  async handleSyncOrderItem(job: Job<SyncRequestDto>): Promise<void> {
    const data = job.data;
    if (!data) return;

    const item = await this._dataSource
      .getRepository(OrderItemEntity)
      .findOneBy({ id: data.id });
    if (!item) return;

    return this.syncOrderItem(data.action, item);
  }

  @Process({
    name: SyncTypeEnum.ORDER_TRANSACTION,
    concurrency: 1,
  })
  async handleSyncOrderTransaction(job: Job<SyncRequestDto>): Promise<void> {
    const data = job.data;
    if (!data) return;

    const transaction = await this._dataSource
      .getRepository(OrderTransactionEntity)
      .findOneBy({ id: data.id, status: Not(TransactionStatus.DRAFT) });
    if (!transaction) return;

    const order = await this._dataSource
      .getRepository(OrderEntity)
      .findOne({ where: { id: transaction.orderId }, select: ['data'] });

    return this.syncOrderTransaction(
      data.action,
      transaction,
      order?.data?.stationId,
    );
  }

  private async syncOrder(
    action: SyncActionEnum,
    order: OrderEntity,
  ): Promise<boolean> {
    if (!action || !order) return;

    const syncLog: SyncLogDto = {
      objectId: order.id,
      type: SyncTypeEnum.ORDER,
      action: action,
      value: order,
      synced: false,
      syncedAt: getUtcNow(),
    };

    try {
      const dto = this._mapper.map(order, OrderEntity, SyncOrderDto);

      const voucherId = order?.discountIds?.[0];

      const [invoice, packageId] = await Promise.all([
        this._getOrderInvoice(order.id),
        this._getPackageVoucher(voucherId),
      ]);

      dto.invoiceStatus = invoice?.invoiceStatus;
      dto.link = invoice?.link;
      dto.packageId = packageId;
      dto.voucherId = voucherId;

      const nflowId = await this._nflow.getGuid(NflowService.ORDER, {
        id: order.id,
      });

      const guid = await this._nflow.sync({
        type: SyncTypeEnum.ORDER,
        action: action,
        data: dto,
        nflowId: nflowId,
      });

      if (typeof guid === 'string') {
        const nflowId = action === SyncActionEnum.Delete ? null : guid;
        await this._updateOrderNflowId(order, nflowId);
      }

      syncLog.synced = !!guid;
    } catch (error) {
      syncLog.synced = false;
    }

    await this._syncService.log(syncLog);

    return syncLog.synced;
  }

  private async _updateOrderNflowId(
    order: OrderEntity,
    nflowId?: string,
  ): Promise<void> {
    try {
      await this._dataSource.getRepository(OrderEntity).update(
        {
          id: order.id,
        },
        {
          nflowId: nflowId,
        },
      );
    } catch (error) {
      this._logger.error(error);
    }
  }

  private async syncOrderItem(
    action: SyncActionEnum,
    item: OrderItemEntity,
  ): Promise<void> {
    if (!action || !item) return;

    const syncLog: SyncLogDto = {
      objectId: item.id,
      type: SyncTypeEnum.ORDER_ITEM,
      action: action,
      value: item,
      synced: false,
      syncedAt: getUtcNow(),
    };

    try {
      const dto = this._mapper.map(item, OrderItemEntity, SyncOrderItemDto);

      const nflowId = await this._nflow.getGuid(NflowService.ORDER_ITEM, {
        id: item.id,
      });

      const guid = await this._nflow.sync({
        type: SyncTypeEnum.ORDER_ITEM,
        action: action,
        data: dto,
        nflowId: nflowId,
      });

      if (typeof guid === 'string') {
        const nflowId = action === SyncActionEnum.Delete ? null : guid;
        await this._updateOrderItemNflowId(item, nflowId);
      }

      syncLog.synced = !!guid;
    } catch (error) {
      syncLog.synced = false;
    }

    await this._syncService.log(syncLog);
  }

  private async _updateOrderItemNflowId(
    item: OrderItemEntity,
    nflowId?: string,
  ): Promise<void> {
    try {
      await this._dataSource.getRepository(OrderItemEntity).update(
        {
          id: item.id,
        },
        {
          nflowId: nflowId,
        },
      );
    } catch (error) {
      this._logger.error(error);
    }
  }

  private async syncOrderTransaction(
    action: SyncActionEnum,
    transaction: OrderTransactionEntity,
    stationId?: string,
  ): Promise<void> {
    if (!action || !transaction) return;

    const syncLog: SyncLogDto = {
      objectId: transaction.id,
      type: SyncTypeEnum.ORDER_TRANSACTION,
      action: action,
      value: transaction,
      synced: false,
      syncedAt: getUtcNow(),
    };

    try {
      const dto = this._mapper.map(
        transaction,
        OrderTransactionEntity,
        SyncOrderTransactionDto,
      );
      dto.stationId = stationId;

      const nflowId = await this._nflow.getGuid(NflowService.TRANSACTION, {
        id: transaction.id,
      });

      const guid = await this._nflow.sync({
        type: SyncTypeEnum.ORDER_TRANSACTION,
        action: action,
        data: dto,
        nflowId: nflowId,
      });

      if (typeof guid === 'string') {
        const nflowId = action === SyncActionEnum.Delete ? null : guid;
        await this._updateOrderTransactionNflowId(transaction, nflowId);
      }

      syncLog.synced = !!guid;
    } catch (error) {
      syncLog.synced = false;
    }

    await this._syncService.log(syncLog);
  }

  private async _updateOrderTransactionNflowId(
    item: OrderTransactionEntity,
    nflowId?: string,
  ): Promise<void> {
    try {
      await this._dataSource.getRepository(OrderTransactionEntity).update(
        {
          id: item.id,
        },
        {
          nflowId: nflowId,
        },
      );
    } catch (error) {
      this._logger.error(error);
    }
  }

  private async _getOrderInvoice(orderId: string): Promise<{
    invoiceStatus?: InvoiceStatusEnum;
    link?: string;
  }> {
    try {
      const invoice = await this._dataSource
        .getRepository(InvoiceEntity)
        .findOneBy({
          orderId: orderId,
        });

      const data = invoice?.data as any;
      const link = data?.['Data']?.['Invoices']?.[0]?.['LinkView'];

      return {
        invoiceStatus: invoice?.status,
        link: link,
      };
    } catch (error) {
      this._logger.error(error);
      return null;
    }
  }

  private async _getPackageVoucher(voucherId?: string): Promise<string> {
    if (!voucherId) return null;

    try {
      const packageVoucher = await this._dataSource
        .getRepository(PackageVoucherEntity)
        .findOne({
          where: {
            voucherId: voucherId,
            status: WashPackageStatus.COMPLETED,
          },
          select: ['packageId'],
        });

      return packageVoucher?.packageId;
    } catch (error) {
      this._logger.error(error);
      return null;
    }
  }
}
