import { AutoMap } from '@automapper/classes';

import {
  ClassFieldOptional,
  DateFieldOptional,
  EnumFieldOptional,
  NumberField,
  StringField,
  StringFieldOptional,
  TaxIdFieldOptional,
} from '../../../../decorators';
import { EventValidityDto } from '../../../voucher/dtos/event-validity.dto';
import { VoucherLocationDto } from '../../../voucher/dtos/voucher-location.dto';
import { WashMode } from '../../../voucher/enums/wash-mode.enum';
import { B2bVoucherInvoiceItemDto } from '../b2b-voucher-invoice.dto';

export class CreateB2bVoucherDto {
  @StringField()
  @AutoMap()
  name: string;

  @StringField()
  @AutoMap()
  description: string;

  @NumberField()
  @AutoMap()
  codeQuantity: number;

  @StringField()
  @AutoMap()
  voucherName: string;

  @StringFieldOptional()
  @AutoMap()
  voucherDescription?: string;

  @NumberField({ min: 1, max: 100 })
  @AutoMap()
  percentage: number;

  @DateFieldOptional()
  @AutoMap()
  startAt?: Date;

  @DateFieldOptional()
  @AutoMap()
  endAt?: Date;

  @ClassFieldOptional(() => VoucherLocationDto)
  @AutoMap(() => VoucherLocationDto)
  location?: VoucherLocationDto;

  @ClassFieldOptional(() => EventValidityDto, { isArray: true, each: true })
  @AutoMap(() => [EventValidityDto])
  excludeTime?: EventValidityDto[];

  @EnumFieldOptional(() => WashMode, { isArray: true, each: true })
  @AutoMap()
  washModes?: WashMode[];

  @TaxIdFieldOptional()
  @AutoMap()
  invoiceTaxCode?: string;

  @StringFieldOptional()
  @AutoMap()
  invoiceName?: string;

  @StringFieldOptional()
  @AutoMap()
  invoiceCompanyName?: string;

  @StringFieldOptional()
  @AutoMap()
  invoiceAddress?: string;

  @ClassFieldOptional(() => B2bVoucherInvoiceItemDto, {
    isArray: true,
    each: true,
  })
  @AutoMap(() => [B2bVoucherInvoiceItemDto])
  invoiceItems?: B2bVoucherInvoiceItemDto[];
}
