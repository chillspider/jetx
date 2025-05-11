import { AutoMap } from '@automapper/classes';

import {
  ClassField,
  EnumFieldOptional,
  StringFieldOptional,
} from '../../../../decorators';
import { EasyInvoiceType } from '../../../easyinvoice/constants/easy-invoice-type.enum';
import {
  InvoiceCode01Type,
  InvoiceCode02Type,
} from '../../../easyinvoice/interfaces/easy-invoice-options-provider.interface';
import { InvoiceProviderDto } from '../invoice-provider.dto';

export class EasyInvoiceSettingRequest {
  @StringFieldOptional()
  code?: string;

  @StringFieldOptional()
  username?: string;

  @StringFieldOptional()
  password?: string;

  @EnumFieldOptional(() => EasyInvoiceType)
  type?: EasyInvoiceType;

  @StringFieldOptional()
  host?: string;

  @StringFieldOptional()
  pattern?: string;

  @EnumFieldOptional(() => InvoiceCode01Type)
  code01?: InvoiceCode01Type;

  @EnumFieldOptional(() => InvoiceCode02Type)
  code02?: InvoiceCode02Type;
}

export class InvoiceProviderRequestDto extends InvoiceProviderDto {
  @ClassField(() => EasyInvoiceSettingRequest)
  @AutoMap(() => EasyInvoiceSettingRequest)
  declare config: EasyInvoiceSettingRequest;
}
