import { IEasyInvoiceOptions } from './easy-invoice-options-provider.interface';

export interface IEasyInvoiceOptionsFactory {
  createOptions(): Promise<IEasyInvoiceOptions> | IEasyInvoiceOptions;
}
