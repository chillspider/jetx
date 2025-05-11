import {
  EnumField,
  EnumFieldOptional,
  StringField,
  StringFieldOptional,
} from '../../../decorators';
import { EasyInvoiceType } from '../constants/easy-invoice-type.enum';
import {
  InvoiceCode01Type,
  InvoiceCode02Type,
} from '../interfaces/easy-invoice-options-provider.interface';

export class EasyInvoiceSetting {
  @StringField()
  code: string; // Enterprise code

  @StringField()
  username: string;

  @StringField()
  password: string;

  @EnumField(() => EasyInvoiceType)
  type: EasyInvoiceType;

  @StringFieldOptional()
  host?: string;

  @StringFieldOptional()
  pattern?: string;

  @EnumFieldOptional(() => InvoiceCode01Type)
  code01?: InvoiceCode01Type;

  @EnumFieldOptional(() => InvoiceCode02Type)
  code02?: InvoiceCode02Type;
}
