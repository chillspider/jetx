import { IInvoiceRequest } from '../../easyinvoice/interfaces/invoice.interface';

export interface IInvoiceConnector {
  getCode(): string;
  createAndIssueInvoice<T>(invoice: IInvoiceRequest): Promise<T>;
  replace<T>(invoice: IInvoiceRequest): Promise<T>;
  testConnection(): Promise<boolean>;
  sendIssuanceNotice(key: string, email: string): Promise<boolean>;
  cancelInvoice(key: string): Promise<boolean>;
}
