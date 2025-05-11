import { AutoMap } from '@automapper/classes';

import {
  ClassField,
  ClassFieldOptional,
  EnumField,
  NumberField,
  StringField,
  StringFieldOptional,
} from '../../../decorators';
import { InvoiceIssueType } from '../enums/invoice-issue-type.enum';
import { InvoiceStatusEnum } from '../enums/invoice-status.enum';
import { InvoiceType } from '../enums/invoice-type.enum';
import { InvoiceBillingDto } from './invoice-billing.dto';
import { InvoiceItemDto } from './invoice-item.dto';

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

  @EnumField(() => InvoiceIssueType)
  @AutoMap()
  issuedType: InvoiceIssueType;
}
