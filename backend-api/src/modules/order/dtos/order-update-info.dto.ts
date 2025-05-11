import {
  PaymentMethod,
  PaymentProvider,
} from '../../payment/enums/payment-method.enum';

export class OrderUpdateInfoRequest {
  deviceId: string;
  modeId: string;
  voucherId?: string;
  note?: string;
  paymentMethod?: PaymentMethod;
  paymentProvider?: PaymentProvider;
}
