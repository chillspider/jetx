import { AutoMap } from '@automapper/classes';

import {
  VoucherIssueTypeEnum,
  VoucherModelEnum,
  VoucherProfileApplicationEnum,
  VoucherStatusEnum,
  VoucherTypeEnum,
} from '../enums/vouchers.enum';
import {
  EventValidityDto,
  VoucherLocationDto,
  VoucherMetadataDto,
} from './voucher.dto';

export class CreateVoucherDto {
  @AutoMap()
  name: string;

  @AutoMap()
  description?: string;

  @AutoMap()
  type!: VoucherTypeEnum;

  @AutoMap()
  profileApplication?: VoucherProfileApplicationEnum;

  @AutoMap()
  voucherModel!: VoucherModelEnum;

  @AutoMap()
  minOrderValue: number;

  @AutoMap()
  maxDeductionValue?: number;

  @AutoMap()
  hiddenCashValue?: number;

  @AutoMap()
  percentage?: number;

  @AutoMap()
  startAt?: Date;

  @AutoMap()
  endAt?: Date;

  @AutoMap(() => VoucherLocationDto)
  location: VoucherLocationDto;

  @AutoMap()
  status!: VoucherStatusEnum;

  @AutoMap()
  userId?: string;

  @AutoMap()
  email?: string;

  @AutoMap(() => [EventValidityDto])
  excludeTime?: EventValidityDto[];

  @AutoMap(() => VoucherMetadataDto)
  data?: VoucherMetadataDto;

  @AutoMap()
  issueType?: VoucherIssueTypeEnum;
}
