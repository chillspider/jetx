/* eslint-disable @typescript-eslint/naming-convention */
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import { getText } from 'number-to-text-vietnamese';

import { removeInvalidChars } from '../../../../common/utils';
import { DEFAULT_TIMEZONE } from '../../../../constants/config';
import { InvoiceTemplate } from '../../constants/invoice.template';
import { ProductFeature } from '../../constants/product-feature.enum';
import { IInvoiceRequest } from '../../interfaces/invoice.interface';
import {
  IInvoiceXml,
  IProductXml,
  ITemplateXml,
} from '../../interfaces/invoice-xml.interface';

type TaxRates = {
  [key: string]: { taxAmount: number; discount: number };
};

dayjs.extend(timezone);

export class CompanyXmlBuilder {
  static DEFAULT_PAYMENT_METHOD = 'Tiền mặt/Chuyển khoản';

  preparePaymentMethod(request: IInvoiceRequest): string {
    return request.paymentMethod || CompanyXmlBuilder.DEFAULT_PAYMENT_METHOD;
  }

  build(request: IInvoiceRequest): ITemplateXml {
    const xmlData: ITemplateXml = this.prepareOrder(InvoiceTemplate, request);
    return xmlData;
  }

  prepareIkey(request: IInvoiceRequest): string {
    return `GTGT-HD-${request.orderId}`;
  }

  prepareArisingDate(request: IInvoiceRequest): string {
    return (
      request.arisingDate || dayjs().tz(DEFAULT_TIMEZONE).format('DD/MM/YYYY')
    );
  }

  prepareOrder(xmlData: ITemplateXml, request: IInvoiceRequest): ITemplateXml {
    const iKey = this.prepareIkey(request);
    const arisingDate = this.prepareArisingDate(request);

    const invoice = xmlData.Invoices.Inv.Invoice as IInvoiceXml;

    invoice.Ikey = String(iKey);
    invoice.PaymentMethod = this.preparePaymentMethod(request);
    invoice.ArisingDate = arisingDate;
    invoice.ExchangeRate = 0;
    invoice.CurrencyUnit = 'VND';
    xmlData.Invoices.Inv.Invoice = invoice;

    xmlData = this.prepareOrderAmount(xmlData, request);
    xmlData = this.prepareOrderBuyer(xmlData, request);
    xmlData = this.prepareOrderItems(xmlData, request);
    xmlData = this.prepareOrderDiscount(xmlData, request);
    return xmlData;
  }

  prepareOrderBuyer(
    xmlData: ITemplateXml,
    request: IInvoiceRequest,
  ): ITemplateXml {
    const { buyer } = request;

    const invoice = xmlData.Invoices.Inv.Invoice as IInvoiceXml;
    invoice.CusCode = ''; // EasyInvoice mapping customer
    invoice.Buyer = removeInvalidChars(buyer?.name || ''); // mục "Tên người mua" trong mẫu hóa đơn
    invoice.CusName = removeInvalidChars(buyer?.billingName) || 'Khách lẻ'; // Mục "Tên đơn vị" trong mẫu hóa đơn
    invoice.Email = buyer?.email || '';
    invoice.EmailCC = buyer?.email || '';
    invoice.CusAddress = buyer?.address || '';
    invoice.CusBankName = '';
    invoice.CusBankNo = '';
    invoice.CusPhone = buyer?.phone || '';
    invoice.CusTaxCode = buyer?.code || '';
    invoice.CusEmails = buyer?.email || '';

    xmlData.Invoices.Inv.Invoice = invoice;
    return xmlData;
  }

  prepareOrderDiscount(
    xmlData: ITemplateXml,
    request: IInvoiceRequest,
  ): ITemplateXml {
    if (request.discountAmount === 0) {
      return xmlData;
    }

    const invoice = xmlData.Invoices.Inv.Invoice as IInvoiceXml;
    const products = invoice.Products.Product as IProductXml[];

    const taxRates = request.items.reduce<TaxRates>((acc, item) => {
      if (!acc[item.taxRate]) {
        acc[item.taxRate] = {
          taxAmount: 0,
          discount: 0,
        };
      }

      const _discount = item.discountAmount;
      const _taxAmount = _discount - _discount / ((100 + item.taxRate) / 100);

      acc[item.taxRate]['taxAmount'] += _taxAmount;
      acc[item.taxRate]['discount'] += _discount;
      return acc;
    }, {});

    Object.keys(taxRates).forEach((rate) => {
      products.push({
        Code: 'DISCOUNT',
        ProdName: 'Chiết khấu',
        // ProdUnit: 'cái',
        // ProdQuantity: 1,
        ProdPrice: Math.round(
          taxRates[rate]['discount'] - taxRates[rate]['taxAmount'],
        ),
        Discount: 0,
        DiscountAmount: 0,
        Feature: ProductFeature.DiscountRow,
        Total: Math.round(
          taxRates[rate]['discount'] - taxRates[rate]['taxAmount'],
        ),
        VATRate: parseInt(rate),
        VATAmount: Math.round(taxRates[rate]['taxAmount']),
        Amount: Math.round(taxRates[rate]['discount']),
      });
    });

    invoice.Products.Product = products;
    xmlData.Invoices.Inv.Invoice = invoice;

    return xmlData;
  }

  prepareOrderAmount(
    xmlData: ITemplateXml,
    request: IInvoiceRequest,
  ): ITemplateXml {
    const invoice = xmlData.Invoices.Inv.Invoice as IInvoiceXml;

    let taxAmount = 0;
    const taxRates = request.items.reduce<{
      [key: string]: number;
    }>((acc, item) => {
      if (!acc[item.taxRate]) {
        acc[item.taxRate] = 0;
      }

      const _amount = item.price * item.qty - item.discountAmount;
      const _taxAmount = _amount - _amount / ((100 + item.taxRate) / 100);

      acc[item.taxRate] += _taxAmount;
      taxAmount += _taxAmount;
      return acc;
    }, {});
    console.log(taxRates);

    invoice.Total = Math.round(request.totalAmount - taxAmount);

    invoice.VATRate = 0;
    invoice.VATAmount = Math.round(taxAmount);

    invoice.Amount = Number(request.totalAmount);
    invoice.AmountInWords = getText(Number(request.totalAmount)) + ' đồng';

    xmlData.Invoices.Inv.Invoice = invoice;
    return xmlData;
  }

  prepareOrderItems(
    xmlData: ITemplateXml,
    request: IInvoiceRequest,
  ): ITemplateXml {
    const invoice = xmlData.Invoices.Inv.Invoice as IInvoiceXml;

    invoice.Products.Product = request.items.map((item) => {
      const taxUnitAmount =
        item.price - item.price / ((100 + item.taxRate) / 100);
      const taxAmount = Math.round(taxUnitAmount * item.qty);
      const price = Math.round(item.price - taxUnitAmount);
      const amount = item.qty * item.price;

      const total = amount - taxAmount; // before tax

      const product = {
        Code: item.sku,
        ProdName: item.name,
        ProdUnit: item.unit,
        ProdQuantity: item.qty,
        ProdPrice: Math.round(price),
        Discount: 0,
        DiscountAmount: 0,
        Feature: ProductFeature.Product,
        Total: Math.round(total),
        VATRate: item.taxRate,
        VATAmount: Math.round(taxAmount),
        Amount: amount,
      } as IProductXml;
      return product;
    });

    xmlData.Invoices.Inv.Invoice = invoice;
    return xmlData;
  }
}
