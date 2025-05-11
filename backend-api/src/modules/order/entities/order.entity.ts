import { AutoMap } from '@automapper/classes';
import { Column, Entity, Generated } from 'typeorm';

import { AbstractEntity } from '../../../common/entities/abstract.entity';
import { ColumnNumericTransformer } from '../../../common/transformers/numeric';
import { ToInt } from '../../../decorators';
import { OrderMembershipDto } from '../../membership/dtos/order-membership.dto';
import {
  PaymentMethod,
  PaymentProvider,
} from '../../payment/enums/payment-method.enum';
import { OrderMetaData } from '../dtos/order-metadata.dto';
import { OrderVoucherDto } from '../dtos/order-voucher.dto';
import { OrderStatusEnum } from '../enums/order-status.enum';
import { OrderTypeEnum } from '../enums/order-type.enum';

@Entity({ name: 'orders', synchronize: false })
export class OrderEntity extends AbstractEntity {
  @Column()
  @Generated('increment')
  @AutoMap()
  incrementId: number;

  @Column({ nullable: true })
  @AutoMap()
  customerId?: string;

  @Column({ length: 200, nullable: true })
  @AutoMap()
  customerName?: string;

  @Column({ length: 200, nullable: true })
  @AutoMap()
  customerEmail?: string;

  @Column({ length: 200, nullable: true })
  @AutoMap()
  customerPhone?: string;

  @Column({ length: 500, nullable: true })
  @AutoMap()
  note?: string;

  @Column({
    type: 'bigint',
    nullable: true,
    transformer: new ColumnNumericTransformer(),
  })
  @ToInt()
  @AutoMap()
  subTotal?: number;

  @Column({ type: 'bigint', transformer: new ColumnNumericTransformer() })
  @ToInt()
  @AutoMap()
  grandTotal: number;

  @Column()
  @AutoMap()
  itemQuantity: number;

  @Column({
    type: 'bigint',
    default: 0,
    transformer: new ColumnNumericTransformer(),
  })
  @AutoMap()
  @ToInt()
  discountAmount: number;

  @Column({
    type: 'bigint',
    nullable: true,
    transformer: new ColumnNumericTransformer(),
  })
  @AutoMap()
  @ToInt()
  taxAmount?: number;

  @Column()
  @AutoMap()
  status: OrderStatusEnum;

  @Column({ type: 'jsonb', default: [] })
  @AutoMap(() => [String])
  discountIds?: string[];

  @Column({ type: 'jsonb', default: [] })
  @AutoMap(() => [OrderVoucherDto])
  discounts?: OrderVoucherDto[];

  @Column()
  @AutoMap()
  paymentMethod: PaymentMethod;

  @Column({ nullable: true })
  @AutoMap()
  paymentProvider?: PaymentProvider;

  @Column({ type: 'jsonb', default: {}, nullable: true })
  @AutoMap(() => OrderMetaData)
  data?: OrderMetaData;

  @Column({ type: 'jsonb', default: {}, nullable: true })
  @AutoMap(() => OrderMembershipDto)
  membership?: OrderMembershipDto;

  @Column({
    type: 'bigint',
    nullable: true,
    transformer: new ColumnNumericTransformer(),
  })
  @AutoMap()
  @ToInt()
  membershipAmount?: number;

  @Column({ nullable: true })
  @AutoMap()
  nflowId?: string;

  @Column({ default: OrderTypeEnum.DEFAULT })
  @AutoMap()
  type?: OrderTypeEnum;

  @Column({
    type: 'bigint',
    nullable: true,
    transformer: new ColumnNumericTransformer(),
  })
  @AutoMap()
  @ToInt()
  extraFee?: number;

  @Column({ type: 'uuid', nullable: true })
  @AutoMap()
  parentId?: string;

  /// Only for washing order
  @Column({ nullable: true })
  @AutoMap()
  yglOrderId?: string;
}
