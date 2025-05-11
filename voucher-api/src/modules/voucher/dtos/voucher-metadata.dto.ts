import { AutoMap } from '@automapper/classes';

import {
  DateFieldOptional,
  NumberFieldOptional,
  StringFieldOptional,
} from '../../../decorators';

export class VoucherMetadataDto {
  // --- Package ---
  @StringFieldOptional()
  @AutoMap()
  packageId?: string;

  @StringFieldOptional()
  @AutoMap()
  orderPackageId?: string;
  // --- Package ---

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
