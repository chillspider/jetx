import { AutoMap } from '@automapper/classes';

import {
  DateFieldOptional,
  EnumField,
  StringField,
  UUIDField,
  UUIDFieldOptional,
} from '../../../decorators';
import { B2bVoucherCodeStatus } from '../../b2b-voucher/enums/b2b-voucher-code.enum';

export class SyncB2BVoucherCodeDto {
  @UUIDField()
  @AutoMap()
  id: string;

  @StringField()
  @AutoMap()
  name: string;

  @UUIDField()
  @AutoMap()
  b2BVoucherId: string;

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
