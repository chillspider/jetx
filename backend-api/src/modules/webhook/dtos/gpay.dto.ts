import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class IEventGPay {
  @ApiProperty()
  @IsNotEmpty()
  data: string;

  @ApiProperty()
  @IsNotEmpty()
  signature: string;
}

export interface IResponseData {
  transactionID: string;
  transactionDateTime: string;
  orderID: string;
  orderNumber: string;
  orderAmount: string;
  orderDescription: string;
  orderCurrency: string;
  orderDateTime: string;
  language: string;
  tokenization?: {
    accountBrand?: string;
    accountSource?: string;
    accountNumber?: string;
    accountName?: string;
    token?: string;
    status?: string;
    message?: string;
  };
}

export interface IDataEventGPay {
  requestID: string;
  responseDateTime: string;
  responseCode: string;
  responseMessage: string;
  responseData: IResponseData;
}

export interface IEventPayResponse {
  ipnStatus: number;
  ipnDescription: string;
}
