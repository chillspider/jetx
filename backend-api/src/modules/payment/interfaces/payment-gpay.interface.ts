import { ApiOperationGPayEnum } from '../enums/api-operation-gpay.enum';

export interface IShipping {
  country: string;
  state: string;
  city: string;
  postalCode: string;
  streetNumber: string;
  address01: string;
  address02: string;
}

export interface IBilling {
  country: string;
  state: string;
  city: string;
  postalCode: string;
  streetNumber: string;
  address01: string;
  address02: string;
}

export interface IApplication {
  applicationID: string;
  applicationChannel: string;
}

export interface IDevice {
  browser: string;
  fingerprint: string;
  hostName: string;
  ipAddress: string;
  deviceID: string;
  deviceModel: string;
}

export interface IExtraData {
  device: IDevice;
  application: IApplication;
  billing: IBilling;
  shipping: IShipping;
}

export interface IGPayRequestData {
  apiOperation: ApiOperationGPayEnum;
  orderID: string;
  orderNumber?: number;
  orderAmount: number;
  orderCurrency: string;
  orderDateTime: string;
  orderDescription: string;
  language: string; // vi or en
  extraData?: IExtraData;
  successURL: string; // callback url when payment is success
  failureURL: string; // callback url when payment is fail
  cancelURL: string; // callback url when cancel
  ipnURL?: string;
  sourceOfFund?: string;
  token?: string;
  paymentMethod?: string;
  sourceType?: string;
}

export interface IGPayPaymentRequest {
  requestID: string;
  requestDateTime: string;
  requestData: IGPayRequestData;
}
