import { AutoMap } from '@automapper/classes';

import {
  ClassFieldOptional,
  NumberField,
  StringField,
  StringFieldOptional,
} from '../../../decorators';

export class B2bVoucherInvoiceItemDto {
  @StringField()
  @AutoMap()
  name: string;

  @StringFieldOptional()
  @AutoMap()
  unit?: string;

  @NumberField()
  @AutoMap()
  price: number;
}

export class B2bVoucherInvoiceDto {
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

  @ClassFieldOptional(() => B2bVoucherInvoiceItemDto, {
    isArray: true,
    each: true,
  })
  @AutoMap(() => [B2bVoucherInvoiceItemDto])
  items?: B2bVoucherInvoiceItemDto[];
}
