export interface IProductXml {
  Code: string;
  ProdName: string;
  ProdUnit?: string;
  ProdQuantity?: number;
  ProdPrice: number;
  Discount: number;
  DiscountAmount: number;
  Feature: number;
  Total: number;
  VATRate: number;
  VATAmount: number;
  Amount: number;
}

export interface IInvoiceXml {
  Products: { Product: IProductXml | IProductXml[] };

  Ikey: string;
  CusCode: string;
  Buyer: string;
  CusName: string;
  Email: string;
  EmailCC: string;
  CusEmails: string;
  CusAddress: string;
  CusBankName: string;
  CusBankNo: string;
  CusPhone: string;
  CusTaxCode: string;
  PaymentMethod: string;
  ArisingDate: string;
  ExchangeRate: number;
  CurrencyUnit: string;

  Total: number;
  VATRate: number;
  VATAmount: number;
  Amount: number;
  AmountInWords: string;
}

export interface ITemplateXml {
  Invoices: {
    Inv: {
      Invoice: IInvoiceXml | Array<{ Invoice: IInvoiceXml }>;
    };
  };
}
