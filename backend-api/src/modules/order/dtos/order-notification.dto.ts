import { AutoMap } from '@automapper/classes';

import {
  EnumField,
  NumberField,
  StringFieldOptional,
  UUIDField,
} from '../../../decorators';
import { OrderStatusEnum } from '../enums/order-status.enum';
import { OrderTypeEnum } from '../enums/order-type.enum';

export class OrderNotificationDto {
  @UUIDField()
  @AutoMap()
  id: string;

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

  @NumberField()
  @AutoMap()
  grandTotal: number;

  @EnumField(() => OrderStatusEnum)
  @AutoMap()
  status: OrderStatusEnum;

  @StringFieldOptional()
  @AutoMap()
  packageName?: string;

  @EnumField(() => OrderTypeEnum)
  @AutoMap()
  type?: OrderTypeEnum;

  @StringFieldOptional()
  @AutoMap()
  parentId?: string;

  @StringFieldOptional()
  @AutoMap()
  fnbOrderId?: string;
}
