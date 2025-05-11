import { AutoMap } from '@automapper/classes';

import { StringField, StringFieldOptional } from '../../../decorators';

export class InvoiceBillingDto {
  @StringFieldOptional()
  @AutoMap()
  id: string;

  @StringField()
  @AutoMap()
  code: string;

  @StringField()
  @AutoMap()
  name: string;

  @StringField()
  @AutoMap()
  billingName: string;

  @StringField()
  @AutoMap()
  phone: string;

  @StringField()
  @AutoMap()
  email: string;

  @StringField()
  @AutoMap()
  address: string;

  @StringField()
  @AutoMap()
  invoiceId: string;
}
