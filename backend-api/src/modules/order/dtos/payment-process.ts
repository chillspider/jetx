import {
  PaymentMethod,
  PaymentProvider,
} from '../../payment/enums/payment-method.enum';

export class PaymentProcessRequest {
  paymentMethod: PaymentMethod;
  paymentProvider: PaymentProvider;
  isTokenize: boolean;
  tokenId: string;
  deviceId?: string;
}

export class PaymentProcessResponse {
  result: boolean;
  endpoint?: string;
  expiredAt?: Date;
  qrCode?: string;
}
