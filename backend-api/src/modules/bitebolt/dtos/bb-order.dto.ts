import { AutoMap } from '@automapper/classes';

import { AbstractDto } from '../../../common/dto/abstract.dto';
import {
  BooleanFieldOptional,
  ClassField,
  EnumField,
  NumberField,
  NumberFieldOptional,
  StringField,
  StringFieldOptional,
} from '../../../decorators';
import { FnbPriceConverter } from '../../../decorators/fnb-price.decorator';
import { BBOrderStatusEnum } from '../enums/bb.enum';

export class BBOrderItemDto extends AbstractDto {
  @StringField()
  @AutoMap()
  productId: string;

  @StringField()
  @AutoMap()
  productName: string;

  @NumberField()
  @AutoMap()
  qty: number;

  @NumberField()
  @FnbPriceConverter()
  @AutoMap()
  price: number;

  @NumberField()
  @FnbPriceConverter()
  @AutoMap()
  total: number;

  @NumberField()
  @FnbPriceConverter()
  @AutoMap()
  taxAmount: number;

  @NumberField()
  @FnbPriceConverter()
  @AutoMap()
  discountAmount: number;

  @StringFieldOptional()
  @AutoMap()
  note: string;

  @StringFieldOptional({ isArray: true })
  @AutoMap()
  discountIds: string[];

  @StringFieldOptional()
  @AutoMap()
  productType?: string;

  @NumberField()
  @FnbPriceConverter()
  @AutoMap()
  originPrice: number;
}

export class BBOrderDto extends AbstractDto {
  // * Mapping Field for Order
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
  @FnbPriceConverter()
  @AutoMap()
  subTotal: number;

  @NumberField()
  @FnbPriceConverter()
  @AutoMap()
  grandTotal: number;

  @NumberField()
  @FnbPriceConverter()
  @AutoMap()
  taxAmount: number;

  @EnumField(() => BBOrderStatusEnum)
  @AutoMap()
  status: BBOrderStatusEnum;

  @NumberFieldOptional()
  @FnbPriceConverter()
  @AutoMap()
  extraFee?: number;

  @NumberFieldOptional()
  @AutoMap()
  itemQuantity: number;
  // * Mapping Field for Order

  @BooleanFieldOptional()
  toGo?: boolean;

  @NumberField()
  incrementId: number;

  @StringField()
  paymentMethod: string;

  @NumberField()
  @FnbPriceConverter()
  discountAmount?: number;

  @StringFieldOptional({ isArray: true })
  discountIds: string[];

  @StringField()
  orderItemType: string;

  @StringField()
  shopId?: string;

  @NumberField()
  @FnbPriceConverter()
  tipAmount?: number;

  @ClassField(() => BBOrderItemDto, { isArray: true })
  orderItems?: BBOrderItemDto[];
}
