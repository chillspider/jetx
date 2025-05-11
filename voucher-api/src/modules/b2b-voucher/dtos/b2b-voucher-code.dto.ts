import { AutoMap } from '@automapper/classes';

import {
  DateFieldOptional,
  EnumField,
  StringField,
  UUIDField,
  UUIDFieldOptional,
} from '../../../decorators';
import { B2bVoucherCodeStatus } from '../enums/b2b-voucher-code.enum';

export class B2bVoucherCodeDto {
  @UUIDField()
  @AutoMap()
  id: string;

  @StringField()
  @AutoMap()
  code: string;

  @UUIDField()
  @AutoMap()
  b2bVoucherId: string;

  @UUIDFieldOptional()
  @AutoMap()
  voucherId?: string;

  @EnumField(() => B2bVoucherCodeStatus)
  @AutoMap()
  status: B2bVoucherCodeStatus;

  @DateFieldOptional()
  @AutoMap()
  redeemedAt?: Date;

  @UUIDFieldOptional()
  @AutoMap()
  redeemedBy?: string;
}
