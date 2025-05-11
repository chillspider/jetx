import { AutoMap } from '@automapper/classes';
import { ValidateIf } from 'class-validator';

import {
  BooleanFieldOptional,
  EnumField,
  StringField,
  StringFieldOptional,
} from '../../../../decorators';
import {
  PaymentMethod,
  PaymentProvider,
} from '../../../payment/enums/payment-method.enum';

export class PaymentPackageRequest {
  @StringField()
  @AutoMap()
  packageId: string;

  @AutoMap()
  @EnumField(() => [
    PaymentMethod.CREDIT,
    PaymentMethod.TOKEN,
    PaymentMethod.QRPAY,
  ])
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

  @StringFieldOptional()
  @AutoMap()
  note?: string;
}
