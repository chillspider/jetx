import { AutoMap } from '@automapper/classes';

import {
  ClassField,
  DateFieldOptional,
  EnumField,
  EnumFieldOptional,
  NumberField,
  NumberFieldOptional,
  StringField,
  UUIDField,
} from '../../../decorators';
import {
  VoucherIssueTypeEnum,
  VoucherModelEnum,
  VoucherProfileApplicationEnum,
  VoucherTypeEnum,
} from '../enums/vouchers.enum';
import { VoucherLocationDto } from './voucher.dto';

export class OrderVoucherDto {
  @UUIDField()
  @AutoMap()
  id: string;

  @StringField()
  @AutoMap()
  name: string;

  @StringField({ nullable: true })
  @AutoMap()
  description?: string;

  @EnumField(() => VoucherTypeEnum)
  @AutoMap()
  type!: VoucherTypeEnum;

  @EnumField(() => VoucherProfileApplicationEnum)
  @AutoMap()
  profileApplication: VoucherProfileApplicationEnum;

  @EnumField(() => VoucherModelEnum)
  @AutoMap()
  voucherModel!: VoucherModelEnum;

  @NumberField()
  @AutoMap()
  minOrderValue: number;

  @NumberFieldOptional()
  @AutoMap()
  maxDeductionValue?: number;

  @NumberField()
  @AutoMap()
  hiddenCashValue: number;

  @NumberField()
  @AutoMap()
  percentage: number;

  @DateFieldOptional()
  @AutoMap()
  startAt?: Date;

  @DateFieldOptional()
  @AutoMap()
  endAt?: Date;

  @ClassField(() => VoucherLocationDto)
  @AutoMap(() => VoucherLocationDto)
  location: VoucherLocationDto;

  @EnumFieldOptional(() => VoucherIssueTypeEnum)
  @AutoMap()
  issueType?: VoucherIssueTypeEnum;
}
