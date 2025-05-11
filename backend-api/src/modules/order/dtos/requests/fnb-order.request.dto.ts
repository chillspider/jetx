import {
  ClassField,
  NumberField,
  NumberFieldOptional,
  StringField,
  StringFieldOptional,
  UUIDFieldOptional,
} from '../../../../decorators';

export class FnbOrderItemRequest {
  @StringFieldOptional()
  id?: string;

  @StringField()
  productId: string;

  @NumberField()
  qty: number;

  @StringFieldOptional()
  note?: string;

  @NumberField()
  originPrice: number;

  @StringField()
  productName: string;

  @NumberField()
  price: number;

  @NumberFieldOptional()
  total?: number;

  @StringFieldOptional()
  photo?: string;
}

export class FnbCreateOrderRequest {
  @StringFieldOptional()
  note?: string;

  @StringField()
  shopId: string;

  @ClassField(() => FnbOrderItemRequest, {
    isArray: true,
    each: true,
  })
  orderItems: FnbOrderItemRequest[];

  @UUIDFieldOptional()
  parentId?: string;
}

export class FnbUpdateOrderRequest {
  @StringField()
  orderId: string;

  @StringField()
  shopId: string;

  @ClassField(() => FnbOrderItemRequest, {
    isArray: true,
    each: true,
  })
  orderItems: FnbOrderItemRequest[];
}
