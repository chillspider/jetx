import { AutoMap } from '@automapper/classes';

import { AbstractDto } from '../../../common/dto/abstract.dto';
import {
  ClassField,
  EnumField,
  NumberField,
  NumberFieldOptional,
  StringField,
  StringFieldOptional,
} from '../../../decorators';
import { OrderMembershipDto } from '../../membership/dtos/order-membership.dto';
import { OrderTransactionDto } from '../../payment/dtos/order-transaction.dto';
import {
  PaymentMethod,
  PaymentProvider,
} from '../../payment/enums/payment-method.enum';
import { OrderStatusEnum } from '../enums/order-status.enum';
import { OrderTypeEnum } from '../enums/order-type.enum';
import { OrderItemDto } from './order-item.dto';
import { OrderMetaData } from './order-metadata.dto';
import { OrderVoucherDto } from './order-voucher.dto';

export class OrderDto extends AbstractDto {
  @NumberField()
  @AutoMap()
  incrementId: number;

  @StringFieldOptional()
  @AutoMap()
  customerId?: string;

  @StringFieldOptional()
  @AutoMap()
  customerName?: string;

  @StringFieldOptional()
  @AutoMap()
  customerEmail?: string;

  @StringFieldOptional()
  @AutoMap()
  customerPhone?: string;

  @StringFieldOptional()
  @AutoMap()
  note?: string;

  @NumberField()
  @AutoMap()
  subTotal?: number;

  @NumberField()
  @AutoMap()
  grandTotal: number;

  @NumberField()
  @AutoMap()
  itemQuantity: number;

  @NumberField()
  @AutoMap()
  discountAmount: number;

  @NumberField()
  @AutoMap()
  taxAmount?: number;

  @EnumField(() => OrderStatusEnum)
  @AutoMap()
  status: OrderStatusEnum;

  @StringField({ isArray: true })
  @AutoMap(() => [String])
  discountIds: string[];

  @ClassField(() => OrderVoucherDto, { isArray: true })
  @AutoMap(() => [OrderVoucherDto])
  discounts?: OrderVoucherDto[];

  @EnumField(() => PaymentMethod)
  @AutoMap()
  paymentMethod: PaymentMethod;

  @EnumField(() => PaymentProvider)
  @AutoMap()
  paymentProvider: PaymentProvider;

  @ClassField(() => OrderMetaData)
  @AutoMap(() => OrderMetaData)
  data?: OrderMetaData;

  @AutoMap(() => OrderMembershipDto)
  membership?: OrderMembershipDto;

  @NumberFieldOptional()
  @AutoMap()
  membershipAmount?: number;

  @EnumField(() => OrderTypeEnum)
  @AutoMap()
  type?: OrderTypeEnum;

  @NumberFieldOptional()
  @AutoMap()
  extraFee?: number;

  orderItems: OrderItemDto[];
  orderTransactions: OrderTransactionDto[];

  // ! FNB Information
  fnbOrderId?: string;
}
