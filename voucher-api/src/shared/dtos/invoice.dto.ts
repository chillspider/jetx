import { AutoMap } from '@automapper/classes';

import {
  ClassField,
  ClassFieldOptional,
  EnumField,
  NumberField,
  StringField,
  StringFieldOptional,
} from '../../decorators';

export enum InvoiceStatusEnum {
  Draft = 'draft',
  Processing = 'processing',
  Completed = 'completed',
  Failed = 'failed',
  Canceled = 'canceled',
}

export enum InvoiceIssueType {
  B2B = 'b2b',
  ORDER = 'order',
}

export enum InvoiceType {
  EASYINVOICE = 'EASY-INVOICE',
}

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

export class InvoiceDto {
  @StringFieldOptional()
  @AutoMap()
  id?: string;

  @EnumField(() => InvoiceType)
  @AutoMap()
  provider?: InvoiceType;

  @StringField()
  @AutoMap()
  orderId: string;

  @NumberField()
  @AutoMap()
  orderIncrementId: number;

  @EnumField(() => InvoiceStatusEnum)
  @AutoMap()
  status: InvoiceStatusEnum;

  @StringField()
  @AutoMap()
  issuedDate: string;

  @StringFieldOptional()
  @AutoMap()
  externalId?: string;

  @NumberField()
  @AutoMap()
  totalAmount: number;

  @NumberField()
  @AutoMap()
  discountAmount: number;

  @AutoMap()
  data: any;

  @ClassField(() => InvoiceItemDto, { isArray: true })
  @AutoMap(() => [InvoiceItemDto])
  items: InvoiceItemDto[];

  @ClassFieldOptional(() => InvoiceBillingDto)
  @AutoMap(() => InvoiceBillingDto)
  invoiceBilling?: InvoiceBillingDto;
}
