import { ITemplateXml } from '../interfaces/invoice-xml.interface';

export const InvoiceTemplate: ITemplateXml = {
  Invoices: {
    Inv: {
      Invoice: {
        Ikey: '0', // unique code
        CusCode: 'Mã khách hàng', // bind data
        Buyer: 'Trần Văn Pháp', // bind data
        CusName: 'CÔNG TY TNHH CAFE ALCHIMIE', // bind data
        Email: 'customer@gmail.com', // bind data
        EmailCC: 'customer1@zodinet.com,customer2@zodinet.com,', // bind data
        CusEmails: 'customer1@zodinet.com,customer2@zodinet.com,', // bind data
        CusAddress: '45 Đường 39, Khu đô Thị Vạn Phúc, Thủ Đức, Tp.HCM', // bind data
        CusBankName: 'Ngân hàng ACB', // bind data
        CusBankNo: '123856947', // bind data
        CusPhone: '961953213', // bind data
        CusTaxCode: '317807970', // bind data
        PaymentMethod: 'Tiền mặt', // bind data
        ArisingDate: '20/12/2023', // bind data
        ExchangeRate: 0,
        CurrencyUnit: 'VND',
        Products: {
          Product: [],
        },
        Total: 0,
        VATRate: 10,
        VATAmount: 0,
        Amount: 0,
        AmountInWords: 'Ba trăm ba mươi nghìn',
      },
    },
  },
};
