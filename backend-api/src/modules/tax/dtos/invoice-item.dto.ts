import { AutoMap } from '@automapper/classes';

import {
  NumberField,
  StringField,
  StringFieldOptional,
} from '../../../decorators';

export class InvoiceItemDto {
  @StringFieldOptional()
  @AutoMap()
  id?: string;

  @StringField()
  @AutoMap()
  sku: string;

  @StringField()
  @AutoMap()
  name: string;

  @NumberField()
  @AutoMap()
  price: number;

  @NumberField()
  @AutoMap()
  taxRate: number;

  @StringField()
  @AutoMap()
  unit: string;

  @NumberField()
  @AutoMap()
  discountAmount: number;

  @NumberField({ int: true })
  @AutoMap()
  qty: number;

  @StringFieldOptional()
  @AutoMap()
  invoiceId?: string;
}
