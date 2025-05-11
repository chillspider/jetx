import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import dayjs from 'dayjs';
import { DataSource, Not } from 'typeorm';

import { getUtcNow } from '../../../common/utils';
import { EVENT } from '../../../constants';
import { SyncActionEnum } from '../../../constants/action';
import { W24Error } from '../../../constants/error-code';
import { ApiConfigService } from '../../../shared/services/api-config.service';
import { LoggerService } from '../../../shared/services/logger.service';
import { OrderEntity } from '../../order/entities/order.entity';
import { OrderStatusEnum } from '../../order/enums/order-status.enum';
import { FnbOrderService } from '../../order/services/fnb-order.service';
import { OrderService } from '../../order/services/order.service';
import { TransactionLogDto } from '../../payment/dtos/transaction-log.dto';
import { OrderTransactionEntity } from '../../payment/entities/order-transaction.entity';
import { OrderTransactionLogType } from '../../payment/enums/order-transaction-log.enum';
import {
  PaymentMethod,
  PaymentProvider,
} from '../../payment/enums/payment-method.enum';
import { PaymentStatusEnum } from '../../payment/enums/payment-status.enum';
import { PaymentOrderTransactionType } from '../../payment/enums/payment-transaction-type.enum';
import { TransactionStatus } from '../../payment/enums/transaction-status.enum';
import { UserTokenEntity } from '../../user/entities/user-token.entity';
import { IDataEventGPay } from '../dtos/gpay.dto';
import { IDataEventGPayQR } from '../dtos/gpay-qr.dto';
import { OrderTypeEnum } from './../../order/enums/order-type.enum';

@Injectable()
export class PaymentWebhookService {
  constructor(
    private readonly _logger: LoggerService,
    private readonly _emitter: EventEmitter2,
    private readonly _dataSource: DataSource,
    private readonly _config: ApiConfigService,
    private readonly _orderService: OrderService,
    private readonly _fnbOrderService: FnbOrderService,
  ) {}

  // GPay
  public async handleGPayWebhookEvent(data: IDataEventGPay): Promise<void> {
    const webhookLog: TransactionLogDto = {
      orderId: data.responseData?.orderID,
      orderIncrementId: Number(data.responseData?.orderNumber),
      paymentMethod: PaymentMethod.CREDIT,
      paymentProvider: PaymentProvider.GPay,
      transactionType: PaymentOrderTransactionType.NOTIFY_WEBHOOK,
      data,
      type: OrderTransactionLogType.WebhookPaymentReq,
      transactionId: data.responseData?.transactionID,
    };

    this._emitter.emit(EVENT.ORDER_TRANSACTION.LOG, webhookLog);

    switch (data.responseCode) {
      case PaymentStatusEnum.SUCCESS:
        this._handleSuccessEvent(data);
        break;
      default:
        this._handleCancelEvent(data);
        break;
    }
  }

  private async _handleCancelEvent(data: IDataEventGPay): Promise<void> {
    const { ...orderResponseData } = data.responseData;

    let orderTransactionStatus = TransactionStatus.FAILED;

    if (data.responseCode === PaymentStatusEnum.CANCEl) {
      orderTransactionStatus = TransactionStatus.CANCELED;
    }

    try {
      await this._handleFailedOrder({
        orderID: orderResponseData.orderID,
        orderTransactionStatus,
      });
    } catch (err) {
      this._logger.log(err);
    }
  }

  private async _getOrderTransactionByOrderId(
    orderId: string,
  ): Promise<OrderTransactionEntity | null> {
    const orderTransaction = await this._dataSource
      .getRepository(OrderTransactionEntity)
      .findOne({
        where: {
          orderId: orderId,
        },
      });

    return orderTransaction;
  }

  private async _getOrderEntity(id: string): Promise<OrderEntity | null> {
    const order = await this._dataSource.getRepository(OrderEntity).findOne({
      where: {
        id: id,
      },
    });

    return order;
  }

  private async _handleSuccessEvent(data: IDataEventGPay): Promise<void> {
    const { transactionID, tokenization, ...orderResponseData } =
      data.responseData;

    //Handle tokenize
    if (tokenization) {
      await this._dataSource.transaction(async (manager) => {
        const orderTransaction = await manager
          .getRepository(OrderTransactionEntity)
          .findOneBy({
            transactionId: transactionID,
          });

        if (orderTransaction) {
          orderTransaction.status = TransactionStatus.SUCCEEDED;
          await manager
            .getRepository(OrderTransactionEntity)
            .save(orderTransaction);

          const hasToken = await manager
            .getRepository(UserTokenEntity)
            .findOneBy({ createdBy: orderTransaction.createdBy });

          await manager.getRepository(UserTokenEntity).save({
            createdBy: orderTransaction.createdBy,
            updatedBy: orderTransaction.createdBy,
            accountBrand: tokenization.accountBrand,
            accountName: tokenization.accountName,
            accountNumber: tokenization.accountNumber,
            accountSource: tokenization.accountSource,
            token: tokenization.token,
            paymentProvider: PaymentProvider.GPay,
            isDefault: !hasToken,
          });
        }
      });
    }

    //Handle order payment success
    const { orderTransaction, status, order } = await this._handleSuccessOrder({
      orderID: orderResponseData.orderID,
      transactionID,
      data,
    });

    if (status && orderTransaction) {
      try {
        await this._dataSource.transaction(async (manager) => {
          await manager.getRepository(OrderEntity).update(
            {
              id: orderResponseData.orderID,
            },
            {
              status: status,
            },
          );

          await manager.getRepository(OrderTransactionEntity).update(
            {
              id: orderTransaction.id,
            },
            {
              status: TransactionStatus.SUCCEEDED,
              data: orderTransaction.data,
            },
          );
        });

        await this.emitPaymentOrder({ ...order, status: status });
      } catch (err) {
        this._logger.error(err);
      }
    }
  }

  private async _handleSuccessOrder({
    orderID,
    data,
  }: {
    orderID: string;
    transactionID: string;
    data: IDataEventGPay;
  }) {
    const [order, orderTransaction] = await Promise.all([
      this._getOrderEntity(orderID),
      this._getOrderTransactionByOrderId(orderID),
    ]);

    if (!order || !orderTransaction) {
      return {};
    }

    let status = order.status;

    const totalPay = !isNaN(+data.responseData.orderAmount)
      ? +data.responseData.orderAmount
      : 0;

    if (totalPay >= order.grandTotal) {
      status = OrderStatusEnum.PENDING;

      if (order.type === OrderTypeEnum.FNB) {
        const isPaid = await this._fnbOrderService.paymentBBOrder(order);
        status = isPaid ? OrderStatusEnum.PENDING : OrderStatusEnum.REFUNDED;
      }

      if (order.type === OrderTypeEnum.TOKENIZE) {
        status = OrderStatusEnum.COMPLETED;
      }
    }

    orderTransaction.status = TransactionStatus.SUCCEEDED;
    orderTransaction.data = {
      ...orderTransaction.data,
      ...data,
    };

    return { orderTransaction, order, status, totalPay };
  }

  private async _handleFailedOrder({
    orderID,
    orderTransactionStatus,
  }: {
    orderID: string;
    orderTransactionStatus: TransactionStatus;
  }) {
    const [order, orderTransaction] = await Promise.all([
      this._getOrderEntity(orderID),
      this._getOrderTransactionByOrderId(orderID),
    ]);

    if (!orderTransaction) {
      return;
    }

    await this._dataSource.getRepository(OrderTransactionEntity).update(
      {
        id: orderTransaction.id,
      },
      {
        status: orderTransactionStatus,
      },
    );

    if (!order) {
      return;
    }

    await this._dataSource.getRepository(OrderEntity).update(
      {
        id: order.id,
      },
      {
        status: OrderStatusEnum.FAILED,
      },
    );

    if (order.type !== OrderTypeEnum.TOKENIZE) {
      // ! Sync Nflow
      this._emitter.emit(EVENT.SYNC.ORDER, {
        action: SyncActionEnum.Sync,
        id: order.id,
      });
    }

    // ! Rollback voucher
    await this._orderService.rollbackVoucher(order.id);

    return { order, orderTransaction };
  }

  // ! QR GPay
  public async handleGPayQRWebhookEvent(
    data: IDataEventGPayQR,
    header: Record<string, string>,
  ): Promise<void> {
    const webhookLog: TransactionLogDto = {
      paymentMethod: PaymentMethod.CREDIT,
      paymentProvider: PaymentProvider.GPay,
      transactionType: PaymentOrderTransactionType.NOTIFY_WEBHOOK,
      data,
      type: OrderTransactionLogType.WebhookQRPaymentReq,
      header: header,
    };

    this._emitter.emit(EVENT.ORDER_TRANSACTION.LOG, webhookLog);

    const result = await this.handleTransactionQR(data);
    if (!result?.isSuccess) {
      const paymentWebhookLog: TransactionLogDto = {
        paymentMethod: PaymentMethod.CREDIT,
        paymentProvider: PaymentProvider.GPay,
        transactionType: PaymentOrderTransactionType.NOTIFY_WEBHOOK,
        type: OrderTransactionLogType.WebhookQRPaymentError,
        orderId: result?.order?.id,
        orderIncrementId: result?.order?.incrementId,
        orderTransactionId: result?.transaction?.id,
        transactionId: data.bankTransId,
        data: { paymentData: data, error: result?.error },
      };
      this._emitter.emit(EVENT.ORDER_TRANSACTION.LOG, paymentWebhookLog);
    }
  }

  private async handleTransactionQR(data: IDataEventGPayQR): Promise<{
    isSuccess: boolean;
    transaction?: OrderTransactionEntity;
    order?: OrderEntity;
    error?: any;
  }> {
    try {
      // ! Validate device id
      const deviceId = data.extraData?.deviceId;
      if (!deviceId) {
        this._logger.error(`[QR] MISSING DEVICE ID`);
        return {
          isSuccess: false,
          error: W24Error.MissingRequiredField('DeviceId'),
        };
      }

      // ! Validate transaction
      const orderTransaction = await this._dataSource
        .getRepository(OrderTransactionEntity)
        .createQueryBuilder('transactions')
        .where({
          paymentMethod: PaymentMethod.QR,
          status: TransactionStatus.PENDING,
        })
        .andWhere(
          `transactions.data IS NOT NULL AND ("transactions"."data"::jsonb->>'deviceId') =:deviceId`,
          { deviceId: deviceId },
        )
        .orderBy('transactions.createdAt', 'DESC')
        .getOne();

      if (!orderTransaction) {
        this._logger.error(`[QR] NOT FOUND TRANSACTION PENDING`);
        return { isSuccess: false, error: W24Error.NotFound('Transaction') };
      }

      // ! Check transaction expiry
      this._logger.info(
        `[QR] PENDING TRANSACTION: ${orderTransaction.createdAt}`,
      );
      this._logger.info(`[QR] IPN TIME: ${getUtcNow()}`);

      const expiredTime = this._config.gpayQR.expiredTrans;
      const diff = dayjs(getUtcNow()).diff(
        dayjs(orderTransaction.createdAt),
        'second',
      );

      this._logger.info(`[QR] WAIT TIME: ${diff} seconds`);

      if (diff > expiredTime) {
        this._logger.error(`[QR] TRANSACTION EXPIRED ${diff - expiredTime}s`);
        return {
          isSuccess: false,
          error: W24Error.TransactionExpired,
          transaction: orderTransaction,
        };
      }

      // ! Validate order
      const order = await this._dataSource
        .getRepository(OrderEntity)
        .findOneBy({
          id: orderTransaction.orderId,
          type: Not(OrderTypeEnum.TOKENIZE),
        });

      if (order?.status !== OrderStatusEnum.DRAFT) {
        this._logger.error(`[QR] ORDER NOT DRAFT: ${order.status}`);
        return {
          isSuccess: false,
          error: W24Error.OrderStatusInvalid,
          transaction: orderTransaction,
          order,
        };
      }

      // ! Validate amount
      const totalPay = !isNaN(+data.amount) ? +data.amount : 0;
      if (totalPay < order.grandTotal) {
        this._logger.error(
          `[QR] AMOUNT NOT ENOUGH ${totalPay} < ${order.grandTotal}`,
        );
        return {
          isSuccess: false,
          error: W24Error.AmountNotEnough,
          transaction: orderTransaction,
          order,
        };
      }

      const status = OrderStatusEnum.PENDING;

      await this._dataSource.transaction(async (manager) => {
        await manager.getRepository(OrderEntity).update(order.id, { status });

        await manager.getRepository(OrderTransactionEntity).update(
          {
            id: orderTransaction.id,
          },
          {
            transactionId: data.bankTransId,
            status: TransactionStatus.SUCCEEDED,
            paymentProvider: PaymentProvider.GPay,
            data: data as any,
            amount: totalPay,
          },
        );
      });

      await this.emitPaymentOrder({ ...order, status });

      return { isSuccess: true, transaction: orderTransaction, order };
    } catch (err) {
      this._logger.error(err);
      return { isSuccess: false, error: W24Error.UnexpectedError };
    }
  }

  private async emitPaymentOrder(order: OrderEntity) {
    const { status, type, id } = order;

    // Emit order notification if status is PENDING or REFUNDED
    if (
      status === OrderStatusEnum.PENDING ||
      status === OrderStatusEnum.REFUNDED
    ) {
      this._emitter.emit(EVENT.ORDER.NOTIFICATION, order);
    }

    // Emit refund event if type is TOKENIZE or status is REFUNDED
    if (
      type === OrderTypeEnum.TOKENIZE ||
      status === OrderStatusEnum.REFUNDED
    ) {
      // ! REFUND
      this._emitter.emit(EVENT.ORDER.REFUND, id);
    }

    if (status === OrderStatusEnum.PENDING) {
      // Emit specific events based on order type
      switch (type) {
        case OrderTypeEnum.PACKAGE:
          // ! PROCESS PACKAGE
          this._emitter.emit(EVENT.PACKAGE.PROCESS, id);
          break;
        case OrderTypeEnum.DEFAULT:
          // ! START DEVICE
          this._emitter.emit(EVENT.ORDER.START_DEVICE, id);
          break;
        default:
          break;
      }
    }

    // ! Sync Nflow
    this._emitter.emit(EVENT.SYNC.ORDER, {
      action: SyncActionEnum.Sync,
      id,
    });
  }
}
