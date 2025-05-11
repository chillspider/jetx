import { ModuleMetadata, Provider, Type } from '@nestjs/common';

import { IEasyInvoiceOptionsFactory } from './easy-invoice-options-factory.interface';
import { IEasyInvoiceOptions } from './easy-invoice-options-provider.interface';

export interface IEasyInvoiceAsyncOptions
  extends Pick<ModuleMetadata, 'imports'> {
  inject?: any[];
  useClass?: Type<IEasyInvoiceOptionsFactory>;
  useExisting?: Type<IEasyInvoiceOptionsFactory>;
  useFactory?: (
    ...args: any[]
  ) => Promise<IEasyInvoiceOptions> | IEasyInvoiceOptions;
  extraProviders?: Provider[];
}
