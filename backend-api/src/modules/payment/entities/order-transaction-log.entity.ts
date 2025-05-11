import { AutoMap } from '@automapper/classes';
import { Column, Entity } from 'typeorm';

import { AbstractEntity } from '../../../common/entities/abstract.entity';
import { OrderTransactionLogType } from '../enums/order-transaction-log.enum';
import { PaymentMethod, PaymentProvider } from '../enums/payment-method.enum';
import { PaymentOrderTransactionType } from '../enums/payment-transaction-type.enum';

@Entity({ synchronize: false, name: 'order_transaction_logs' })
export class OrderTransactionLogEntity extends AbstractEntity {
  @Column()
  @AutoMap()
  type: OrderTransactionLogType;

  @Column()
  @AutoMap()
  paymentMethod: PaymentMethod;

  @Column()
  @AutoMap()
  paymentProvider: PaymentProvider;

  @Column({ nullable: true })
  @AutoMap()
  transactionType: PaymentOrderTransactionType;

  @Column({ nullable: true })
  @AutoMap()
  orderId?: string;

  @Column({ nullable: true })
  @AutoMap()
  orderIncrementId: number;

  @Column({ nullable: true })
  @AutoMap()
  orderTransactionId?: string;

  @Column({ nullable: true })
  @AutoMap()
  transactionId: string;

  @Column({ nullable: true })
  @AutoMap()
  requestId?: string;

  @AutoMap()
  @Column({ type: 'json', default: '{}' })
  data: Record<string, unknown>;

  @AutoMap()
  @Column({ type: 'json', default: '{}' })
  header?: Record<string, unknown>;

  @AutoMap()
  @Column({ type: 'json', default: '{}' })
  params?: Record<string, unknown>;
}
