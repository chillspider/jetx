import { AutoMap } from '@automapper/classes';
import { ValidateIf } from 'class-validator';

import {
  BooleanFieldOptional,
  EnumField,
  StringField,
  UUIDField,
} from '../../../../decorators';
import {
  PaymentMethod,
  PaymentProvider,
} from '../../../payment/enums/payment-method.enum';

export class PaymentOrderRequest {
  @UUIDField()
  @AutoMap()
  orderId: string;

  @AutoMap()
  @EnumField(() => PaymentMethod)
  paymentMethod: PaymentMethod;

  @AutoMap()
  @ValidateIf((o) => o.paymentMethod === PaymentMethod.CREDIT)
  @EnumField(() => PaymentProvider)
  paymentProvider: PaymentProvider;

  @AutoMap()
  @ValidateIf((o) => o.paymentMethod === PaymentMethod.CREDIT)
  @BooleanFieldOptional()
  isTokenize: boolean;

  @AutoMap()
  @ValidateIf((o) => o.paymentMethod === PaymentMethod.TOKEN)
  @StringField()
  tokenId: string;
}
