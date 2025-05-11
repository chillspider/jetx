import { GPayQRExtraData } from '../../payment/dtos/gpay/gpay-qr-request';

export interface IDataEventGPayQR {
  refNo: string;
  accountNo: string;
  amount: number;
  bankId: string;
  bankTransId: string;
  fromAccNo: string;
  fromAccName: string;
  fromBankCode: string;
  fromBankName: string;
  extraData: GPayQRExtraData;
}

export interface IEventGPayQRResponse {
  resCode: string;
  resMessage: string;
}
