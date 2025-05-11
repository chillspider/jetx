import { AutoMap } from '@automapper/classes';

import { AbstractDto } from '../../../common/dto/abstract.dto';
import {
  BooleanField,
  ClassField,
  ClassFieldOptional,
  DateField,
  DateFieldOptional,
  EnumField,
  EnumFieldOptional,
  NumberField,
  NumberFieldOptional,
  StringField,
  StringFieldOptional,
} from '../../../decorators';
import { WashMode } from '../../yigoli/enums/wash-mode.enum';
import {
  VoucherIssueTypeEnum,
  VoucherModelEnum,
  VoucherProfileApplicationEnum,
  VoucherStatusEnum,
  VoucherTypeEnum,
} from '../enums/vouchers.enum';

export class VoucherLocationDto {
  @StringField({ isArray: true, each: true, nullable: true })
  @AutoMap(() => [String])
  stationIds: string[] = [];

  @StringField({ isArray: true, each: true, nullable: true })
  @AutoMap(() => [String])
  deviceIds: string[] = [];

  @BooleanField()
  @AutoMap()
  isExcluded: boolean = false;
}

export class EventValidityDto {
  @StringField()
  @AutoMap()
  guid: string;

  @StringFieldOptional()
  @AutoMap()
  name?: string;

  @StringFieldOptional()
  @AutoMap()
  description?: string;

  @DateField()
  @AutoMap()
  start: Date;

  @DateField()
  @AutoMap()
  end: Date;
}

export class VoucherValidityDto {
  @ClassField(() => EventValidityDto, { isArray: true, each: true })
  @AutoMap(() => [EventValidityDto])
  excludeTimes: EventValidityDto[];

  @EnumFieldOptional(() => WashMode, { isArray: true, each: true })
  washModes?: WashMode[];
}

export class VoucherMetadataDto {
  @StringFieldOptional()
  @AutoMap()
  packageId?: string;

  @StringFieldOptional()
  @AutoMap()
  orderPackageId?: string;

  @StringFieldOptional()
  @AutoMap()
  stationId?: string;

  @StringFieldOptional()
  @AutoMap()
  stationName?: string;

  @NumberFieldOptional()
  @AutoMap()
  orderIncrementId?: number;

  @DateFieldOptional()
  @AutoMap()
  orderCreatedAt?: Date;

  // --- B2B Voucher ---
  @StringFieldOptional()
  @AutoMap()
  b2bVoucherId?: string;

  @StringFieldOptional()
  @AutoMap()
  b2bVoucherCode?: string;
  // --- B2B Voucher ---
}

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

  @StringFieldOptional({ nullable: true })
  @AutoMap()
  orderId?: string;

  @StringFieldOptional({ nullable: true })
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
}
