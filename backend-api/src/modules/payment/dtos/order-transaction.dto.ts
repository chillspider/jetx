import { AutoMap } from '@automapper/classes';

import { AbstractDto } from '../../../common/dto/abstract.dto';
import { PaymentMethod, PaymentProvider } from '../enums/payment-method.enum';
import { TransactionStatus } from '../enums/transaction-status.enum';

export class OrderTransactionDto extends AbstractDto {
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
}
