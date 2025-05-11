export class BBPlaceOrderResponseDto {
  result: boolean;
  clientSecret?: string;
  paymentIntentId?: string;
  orderId?: string;
  incrementId?: number;
  token?: string;
  expireAt?: string;
}
