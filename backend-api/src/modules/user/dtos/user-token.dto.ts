import { AutoMap } from '@automapper/classes';

import {
  BooleanField,
  EnumField,
  StringField,
  StringFieldOptional,
} from '../../../decorators';
import { PaymentProvider } from '../../payment/enums/payment-method.enum';

export class UserTokenDto {
  @StringField()
  @AutoMap()
  id: string;

  @StringFieldOptional()
  @AutoMap()
  accountBrand?: string;

  @StringFieldOptional()
  @AutoMap()
  accountSource?: string;

  @StringFieldOptional()
  @AutoMap()
  accountNumber?: string;

  @StringFieldOptional()
  @AutoMap()
  accountName?: string;

  @StringFieldOptional()
  token: string;

  @EnumField(() => PaymentProvider)
  @AutoMap()
  paymentProvider: PaymentProvider;

  @BooleanField()
  @AutoMap()
  isDefault: boolean;
}
