import { EnumField, StringField } from '../../../../decorators';

export enum GPayQRType {
  ONE_TIME = 'ONE_TIME',
  MANY_TIME = 'MANY_TIME',
}

export enum GPayQRSourcePaymentType {
  QR_VA = 'QR_VA',
  QR_LOYALTY = 'QR_LOYALTY',
  QR_GP = 'QR_GP',
}

export enum GPayQRStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
}

export class GPayQRExtraData {
  deviceId: string;
}

export class GPayQRGenerate {
  accountName: string;
  refNo: string;
  amount: number;
  qrType: GPayQRType;
  content?: string;
  callbackUrl: string;
  expireAt?: number; /// 9999-12-31 23:59:59 - YYYYMMDDHHMMSS
  extraData?: GPayQRExtraData;
  caller: string;
  sourcePaymentType: GPayQRSourcePaymentType;
  merchantId: string;
  checkoutChannel?: string;
  brandCode?: string;
}

export class UpdateGPayQRRequest {
  @StringField()
  accountNo: string;

  @EnumField(() => GPayQRStatus)
  status: GPayQRStatus;
}
