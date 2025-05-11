import { AutoMap } from '@automapper/classes';

import {
  ClassField,
  NumberField,
  StringField,
  StringFieldOptional,
} from '../../../../decorators';

export class InvoiceItemRequestDto {
  @StringField()
  @AutoMap()
  name: string;

  @NumberField()
  @AutoMap()
  price: number;

  @StringFieldOptional()
  @AutoMap()
  unit?: string;
}

export class InvoiceBillingRequestDto {
  @StringFieldOptional()
  @AutoMap()
  code?: string;

  @StringFieldOptional()
  @AutoMap()
  name?: string;

  @StringFieldOptional()
  @AutoMap()
  billingName?: string;

  @StringFieldOptional()
  @AutoMap()
  address?: string;
}

export class CreateB2bInvoiceRequestDto {
  @StringField()
  @AutoMap()
  orderId: string;

  @NumberField()
  @AutoMap()
  orderIncrementId: number;

  @ClassField(() => InvoiceItemRequestDto, {
    isArray: true,
    each: true,
  })
  @AutoMap()
  items: InvoiceItemRequestDto[];

  @ClassField(() => InvoiceBillingRequestDto)
  @AutoMap()
  invoiceBilling: InvoiceBillingRequestDto;
}
