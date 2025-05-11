import { AutoMap } from '@automapper/classes';

import {
  PaymentMethod,
  PaymentProvider,
} from '../../payment/enums/payment-method.enum';
import { TransactionStatus } from '../../payment/enums/transaction-status.enum';

export class SyncOrderTransactionDto {
  @AutoMap()
  id: string;

  @AutoMap()
  orderId: string;

  @AutoMap()
  transactionId: string;

  @AutoMap()
  status: TransactionStatus;

  @AutoMap()
  amount: number;

  @AutoMap()
  paymentMethod?: PaymentMethod;

  @AutoMap()
  paymentProvider?: PaymentProvider;

  @AutoMap()
  data?: Record<string, string | Date | any>;

  @AutoMap()
  incrementId: number;

  stationId?: string;
}
