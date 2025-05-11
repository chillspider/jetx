import {
  BooleanField,
  ClassFieldOptional,
  EnumField,
  EnumFieldOptional,
} from '../../../decorators';
import { UserTokenDto } from '../../user/dtos/user-token.dto';
import { PaymentMethod, PaymentProvider } from '../enums/payment-method.enum';

export class PaymentMethodModel {
  @EnumField(() => PaymentMethod)
  method: PaymentMethod;

  @EnumFieldOptional(() => PaymentProvider)
  provider?: PaymentProvider;

  @ClassFieldOptional(() => UserTokenDto)
  token?: UserTokenDto;

  @BooleanField()
  isDefault?: boolean = false;
}
