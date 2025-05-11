import { IEasyInvoiceResponse } from './easy-invoice-response.interface';

export interface IEasyInvoiceResult {
  result: boolean;
  externalId?: string;
  data: IEasyInvoiceResponse;
}
