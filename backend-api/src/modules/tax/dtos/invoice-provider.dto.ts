import { AutoMap } from '@automapper/classes';

import {
  ClassField,
  EnumField,
  StringFieldOptional,
} from '../../../decorators';
import { EasyInvoiceSetting } from '../../easyinvoice/dtos/easy-invoice-setting.dto';
import { InvoiceProviderStatus } from '../enums/invoice-provider-status.enum';
import { InvoiceType } from '../enums/invoice-type.enum';

export class InvoiceProviderDto {
  @StringFieldOptional()
  @AutoMap()
  id: string;

  @EnumField(() => InvoiceProviderStatus)
  @AutoMap()
  status: InvoiceProviderStatus;

  @EnumField(() => InvoiceType)
  @AutoMap()
  type: InvoiceType;

  @ClassField(() => EasyInvoiceSetting)
  @AutoMap(() => EasyInvoiceSetting)
  config: Partial<EasyInvoiceSetting>;
}
