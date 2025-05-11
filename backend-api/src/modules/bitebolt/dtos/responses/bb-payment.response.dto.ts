import {
  BooleanField,
  NumberFieldOptional,
  StringFieldOptional,
} from '../../../../decorators';

export class BBPaymentResponseDto {
  @BooleanField()
  result: boolean;

  @StringFieldOptional()
  orderId?: string;

  @StringFieldOptional()
  orderTransactionId?: string;

  @NumberFieldOptional()
  incrementId?: number;
}
