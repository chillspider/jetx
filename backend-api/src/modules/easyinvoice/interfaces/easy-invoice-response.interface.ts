export interface IInvoiceDocumentResponse {
  No: string;
  Ikey: string;
  Buyer: string;
  Total: number;
  Amount: number;
  Serial: string;
  Pattern: string;
  LinkView: string;
  IssueDate: string;
  TaxAmount: number;
  LookupCode: string;
  ArisingDate: string;
  PublishedBy: string;
  CustomerCode: string;
  CustomerName: string;
  ModifiedDate: string;
  InvoiceStatus: number;
  TCTCheckStatus: string;
  CustomerAddress: string;
  CustomerTaxCode: string;
  TCTErrorMessage: string | null;
  IsSentTCTSummary: boolean;
  TaxAuthorityCode: string;
}

export interface IInvoiceResponse {
  Pattern: string;
  Serial: string;
  KeyInvoiceNo: { [key: string]: any };
  Invoices: IInvoiceDocumentResponse[];
}

export interface IEasyInvoiceResponse {
  Status: number;
  Message: string;
  Data: IInvoiceResponse;
  ErrorCode: number;
}
