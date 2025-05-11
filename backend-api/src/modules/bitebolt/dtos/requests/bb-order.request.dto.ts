import {
  BooleanField,
  ClassField,
  DateFieldOptional,
  EnumField,
  NumberField,
  NumberFieldOptional,
  StringField,
  StringFieldOptional,
} from '../../../../decorators';
import { FnbPriceConverter } from '../../../../decorators/fnb-price.decorator';
import { BBOrderItemTypeEnum } from '../../enums/bb.enum';
import {
  BBLinkedProductGroupDto,
  BBProductOptionTypeDto,
} from '../bb-product.dto';

export class BBOrderItemRequest {
  @StringFieldOptional()
  id?: string;

  @StringField()
  productId: string;

  @NumberField()
  qty: number;

  @StringFieldOptional()
  note?: string;

  @FnbPriceConverter()
  @NumberField()
  originPrice: number;

  @StringField()
  productName: string;

  @FnbPriceConverter()
  @NumberField()
  price: number;

  @FnbPriceConverter()
  @NumberFieldOptional()
  total?: number;

  @ClassField(() => BBProductOptionTypeDto, {
    isArray: true,
    each: true,
  })
  optionTypes: BBProductOptionTypeDto[] = [];

  @ClassField(() => BBLinkedProductGroupDto, {
    isArray: true,
    each: true,
  })
  linkedProductGroups: BBLinkedProductGroupDto[] = [];

  @StringField({ isArray: true, each: true })
  discountIds: string[] = [];

  @DateFieldOptional()
  deletedAt?: Date;
}

export class BBCreateOrderRequest {
  @StringFieldOptional()
  note?: string;

  @StringField()
  shopId: string;

  @BooleanField()
  toGo: boolean;

  @StringFieldOptional()
  customerName?: string;

  @StringFieldOptional()
  customerPhone?: string;

  @ClassField(() => BBOrderItemRequest, {
    isArray: true,
    each: true,
  })
  orderItems: BBOrderItemRequest[];

  @EnumField(() => BBOrderItemTypeEnum)
  orderItemType: BBOrderItemTypeEnum;
}

export class BBPaymentOrderRequest {
  @StringField()
  orderId: string;

  @StringFieldOptional({ default: 'cash' })
  paymentMethod?: string = 'cash';

  @StringFieldOptional()
  note?: string;

  @StringFieldOptional()
  shopId?: string;
}

export class BBUpdateOrderItemsRequest {
  @StringField()
  shopId: string;

  @StringField()
  orderId: string;

  @ClassField(() => BBOrderItemRequest, {
    isArray: true,
    each: true,
  })
  orderItems: BBOrderItemRequest[];

  @EnumField(() => BBOrderItemTypeEnum)
  orderItemType: BBOrderItemTypeEnum;
}

export class BBPlaceOrderRequest {
  @StringField()
  orderId: string;

  @StringField()
  paymentMethod: string;

  @StringFieldOptional()
  note?: string;

  @StringFieldOptional()
  shopId?: string;

  giftCardGroups: any[] = [];
  source: string;
}
