import { AutoMap } from '@automapper/classes';

import { AbstractDto } from '../../../common/dto/abstract.dto';
import {
  ClassField,
  ClassFieldOptional,
  DateFieldOptional,
  EnumField,
  EnumFieldOptional,
  NumberField,
  NumberFieldOptional,
  StringField,
  UUIDFieldOptional,
} from '../../../decorators';
import {
  VoucherIssueTypeEnum,
  VoucherModelEnum,
  VoucherProfileApplicationEnum,
  VoucherStatusEnum,
  VoucherTypeEnum,
} from '../enums/vouchers.enum';
import { VoucherLocationDto } from './voucher-location.dto';
import { VoucherMetadataDto } from './voucher-metadata.dto';
import { VoucherValidityDto } from './voucher-validity.dto';

export class VoucherDto extends AbstractDto {
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

  @EnumField(() => VoucherStatusEnum)
  @AutoMap()
  status!: VoucherStatusEnum;

  @UUIDFieldOptional({ nullable: true })
  @AutoMap()
  orderId?: string;

  @UUIDFieldOptional({ nullable: true })
  @AutoMap()
  userId?: string;

  @ClassFieldOptional(() => VoucherValidityDto)
  @AutoMap(() => VoucherValidityDto)
  validity?: VoucherValidityDto;

  @ClassFieldOptional(() => VoucherMetadataDto)
  @AutoMap(() => VoucherMetadataDto)
  data?: VoucherMetadataDto;

  @EnumFieldOptional(() => VoucherIssueTypeEnum)
  @AutoMap()
  issueType?: VoucherIssueTypeEnum;

  // This field is not present in the entity
  @NumberField()
  @AutoMap()
  deduction?: number;
}
