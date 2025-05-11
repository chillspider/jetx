export class GPayResponseData {
  transactionID: string;
  endpoint: string;
  qrCode?: string;

  transactionStatus?: string;
  transactionDescription?: string;
  orderID?: string;
  orderNumber?: string;
  orderAmount?: string;
  orderDescription?: string;
  orderCurrency?: string;
  orderDateTime?: string;
}

export class GPayPaymentResponseDto {
  requestID: string;
  responseDateTime: string;
  responseCode: string;
  responseMessage: string;
  responseData: GPayResponseData;
}

export class GPayPaymentSettingDto {
  apiKey: string;
  salt: string;
}

export class GPayResponseDto<T> {
  requestID: string;
  responseDateTime: string;
  responseCode: string;
  responseMessage: string;
  responseData: T;
}
