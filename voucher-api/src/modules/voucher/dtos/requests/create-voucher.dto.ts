import { AutoMap } from '@automapper/classes';

import {
  ClassField,
  ClassFieldOptional,
  DateFieldOptional,
  EmailFieldOptional,
  EnumField,
  EnumFieldOptional,
  NumberFieldOptional,
  StringField,
  StringFieldOptional,
  UUIDFieldOptional,
} from '../../../../decorators';
import {
  VoucherIssueTypeEnum,
  VoucherModelEnum,
  VoucherProfileApplicationEnum,
  VoucherStatusEnum,
  VoucherTypeEnum,
} from '../../enums/vouchers.enum';
import { WashMode } from '../../enums/wash-mode.enum';
import { EventValidityDto } from '../event-validity.dto';
import { VoucherLocationDto } from '../voucher-location.dto';
import { VoucherMetadataDto } from '../voucher-metadata.dto';

export class CreateVoucherDto {
  @StringField()
  @AutoMap()
  name: string;

  @StringFieldOptional()
  @AutoMap()
  description?: string;

  @EnumField(() => VoucherTypeEnum)
  @AutoMap()
  type!: VoucherTypeEnum;

  @EnumFieldOptional(() => VoucherProfileApplicationEnum)
  @AutoMap()
  profileApplication?: VoucherProfileApplicationEnum;

  @EnumFieldOptional(() => VoucherModelEnum)
  @AutoMap()
  voucherModel!: VoucherModelEnum;

  @NumberFieldOptional()
  @AutoMap()
  minOrderValue: number;

  @NumberFieldOptional()
  @AutoMap()
  maxDeductionValue?: number;

  @NumberFieldOptional()
  @AutoMap()
  hiddenCashValue?: number;

  @NumberFieldOptional()
  @AutoMap()
  percentage?: number;

  @DateFieldOptional()
  @AutoMap()
  startAt?: Date;

  @DateFieldOptional()
  @AutoMap()
  endAt?: Date;

  @ClassField(() => VoucherLocationDto)
  @AutoMap(() => VoucherLocationDto)
  location: VoucherLocationDto;

  @EnumFieldOptional(() => VoucherStatusEnum)
  @AutoMap()
  status!: VoucherStatusEnum;

  @UUIDFieldOptional()
  @AutoMap()
  userId?: string;

  @EmailFieldOptional()
  @AutoMap()
  email?: string;

  @ClassFieldOptional(() => EventValidityDto, { isArray: true, each: true })
  @AutoMap(() => [EventValidityDto])
  excludeTime?: EventValidityDto[];

  @ClassFieldOptional(() => VoucherMetadataDto)
  @AutoMap(() => VoucherMetadataDto)
  data?: VoucherMetadataDto;

  @EnumFieldOptional(() => VoucherIssueTypeEnum)
  @AutoMap()
  issueType?: VoucherIssueTypeEnum;

  @EnumFieldOptional(() => WashMode, { isArray: true, each: true })
  @AutoMap()
  washModes?: WashMode[];
}

export class BulkCreateVoucherRequest {
  @ClassField(() => CreateVoucherDto, { isArray: true, each: true })
  vouchers: CreateVoucherDto[];
}
