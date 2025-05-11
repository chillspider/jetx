import { AutoMap } from '@automapper/classes';

import { OrderTransactionLogType } from '../enums/order-transaction-log.enum';
import { PaymentMethod, PaymentProvider } from '../enums/payment-method.enum';
import { PaymentOrderTransactionType } from '../enums/payment-transaction-type.enum';

export class TransactionLogDto {
  @AutoMap()
  type?: OrderTransactionLogType;

  @AutoMap()
  paymentMethod: PaymentMethod;

  @AutoMap()
  paymentProvider: PaymentProvider;

  @AutoMap()
  transactionType: PaymentOrderTransactionType;

  @AutoMap()
  orderId?: string;

  @AutoMap()
  orderIncrementId?: number;

  @AutoMap()
  orderTransactionId?: string;

  @AutoMap()
  transactionId?: string;

  @AutoMap()
  requestId?: string;

  @AutoMap()
  data?: unknown;

  @AutoMap()
  header?: Record<string, unknown>;

  @AutoMap()
  params?: Record<string, unknown>;
}
