import { AutoMap } from '@automapper/classes';

import {
  ClassFieldOptional,
  DateFieldOptional,
  EnumField,
  NumberField,
  StringField,
  StringFieldOptional,
  UUIDField,
} from '../../../decorators';
import { VoucherLocationDto } from '../../voucher/dtos/voucher-location.dto';
import { VoucherValidityDto } from '../../voucher/dtos/voucher-validity.dto';
import { B2bVoucherStatus } from '../enums/b2b-voucher.enum';

export class B2bVoucherDto {
  @UUIDField()
  @AutoMap()
  id: string;

  @StringField()
  @AutoMap()
  name: string;

  @StringField()
  @AutoMap()
  description: string;

  @EnumField(() => B2bVoucherStatus)
  @AutoMap()
  status: B2bVoucherStatus;

  @NumberField()
  @AutoMap()
  codeQuantity: number;

  @StringField()
  @AutoMap()
  voucherName: string;

  @StringFieldOptional()
  @AutoMap()
  voucherDescription?: string;

  @NumberField()
  @AutoMap()
  percentage: number;

  @DateFieldOptional()
  @AutoMap()
  startAt?: Date;

  @DateFieldOptional()
  @AutoMap()
  endAt?: Date;

  @ClassFieldOptional(() => VoucherLocationDto)
  @AutoMap(() => VoucherLocationDto)
  location?: VoucherLocationDto;

  @ClassFieldOptional(() => VoucherValidityDto)
  @AutoMap(() => VoucherValidityDto)
  validity?: VoucherValidityDto;
}
