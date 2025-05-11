import { AutoMap } from '@automapper/classes';

import { EventValidityDto } from '../../voucher/dtos/event-validity.dto';
import { VoucherLocationDto } from '../../voucher/dtos/voucher-location.dto';
import {
  VoucherModelEnum,
  VoucherProfileApplicationEnum,
  VoucherStatusEnum,
  VoucherTypeEnum,
} from '../../voucher/enums/vouchers.enum';

export class SyncVoucherDto {
  @AutoMap()
  id: string;

  @AutoMap()
  name: string;

  @AutoMap()
  description?: string;

  @AutoMap()
  type!: VoucherTypeEnum;

  @AutoMap()
  profileApplication: VoucherProfileApplicationEnum;

  @AutoMap()
  voucherModel!: VoucherModelEnum;

  @AutoMap()
  minOrderValue: number;

  @AutoMap()
  maxDeductionValue?: number;

  @AutoMap()
  hiddenCashValue: number;

  @AutoMap()
  percentage: number;

  @AutoMap()
  startAt?: Date;

  @AutoMap()
  endAt?: Date;

  @AutoMap(() => VoucherLocationDto)
  location: VoucherLocationDto;

  @AutoMap()
  status!: VoucherStatusEnum;

  @AutoMap()
  orderId?: string;

  @AutoMap()
  userId?: string;

  @AutoMap()
  email?: string;

  @AutoMap(() => [EventValidityDto])
  excludeTime: EventValidityDto[];

  @AutoMap()
  packageId?: string;

  @AutoMap()
  orderPackageId?: string;

  @AutoMap()
  voucherId?: string;

  @AutoMap()
  username?: string;

  @AutoMap()
  stationId?: string;

  @AutoMap()
  stationName?: string;

  @AutoMap()
  transactionId?: number;

  @AutoMap()
  transactionTimestamp?: Date;
}
