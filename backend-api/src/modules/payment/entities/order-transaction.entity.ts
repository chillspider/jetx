import { AutoMap } from '@automapper/classes';
import { Column, Entity, Generated } from 'typeorm';

import { AbstractEntity } from '../../../common/entities/abstract.entity';
import { ColumnNumericTransformer } from '../../../common/transformers/numeric';
import { ToInt } from '../../../decorators';
import { PaymentMethod, PaymentProvider } from '../enums/payment-method.enum';
import { TransactionStatus } from '../enums/transaction-status.enum';

@Entity({ synchronize: false, name: 'order_transactions' })
export class OrderTransactionEntity extends AbstractEntity {
  @Column({ type: 'uuid' })
  @AutoMap()
  orderId: string;

  @Column()
  @AutoMap()
  transactionId: string;

  @Column()
  @AutoMap()
  status: TransactionStatus;

  @Column({
    type: 'bigint',
    default: 0,
    transformer: new ColumnNumericTransformer(),
  })
  @ToInt()
  @AutoMap()
  amount: number;

  @Column({ nullable: true })
  @AutoMap()
  paymentMethod?: PaymentMethod;

  @Column({ nullable: true })
  @AutoMap()
  paymentProvider?: PaymentProvider;

  @Column({ type: 'json', nullable: true })
  @AutoMap()
  data?: Record<string, string | Date | any>;

  @Column()
  @AutoMap()
  @Generated('increment')
  incrementId: number;

  @Column({ nullable: true })
  @AutoMap()
  nflowId?: string;
}
