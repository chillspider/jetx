export interface IInvoiceItemRequest {
  sku: string;
  name: string;
  unit: string;
  qty: number;
  price: number;
  discount?: number;
  discountAmount: number;
  taxRate: number;
}

export interface IInvoiceBuyerRequest {
  code?: string;
  name: string;
  billingName?: string;
  email?: string;
  address?: string;
  phone?: string;
}

export interface IInvoiceRequest {
  id?: string;
  orderId?: string;
  buyer: IInvoiceBuyerRequest;
  arisingDate?: string;
  paymentMethod?: string;
  totalAmount: number;
  discountAmount: number;
  items: IInvoiceItemRequest[];
}
