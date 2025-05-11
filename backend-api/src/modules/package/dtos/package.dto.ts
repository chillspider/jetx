import { AutoMap } from '@automapper/classes';

import {
  ClassFieldOptional,
  EnumField,
  NumberField,
  NumberFieldOptional,
  StringField,
  StringFieldOptional,
} from '../../../decorators';
import { EventValidityDto } from '../../order/dtos/voucher.dto';
import { PackageStatus } from '../enums/package-status.enum';

export class PackageVoucherDto {
  @StringField()
  @AutoMap()
  name: string;

  @StringFieldOptional()
  @AutoMap()
  description?: string;

  @NumberField()
  @AutoMap()
  value: number;

  @NumberFieldOptional()
  @AutoMap()
  quantity?: number;

  @ClassFieldOptional(() => EventValidityDto, { isArray: true, each: true })
  @AutoMap(() => [EventValidityDto])
  excludeTimes?: EventValidityDto[];
}

export class InvoicePackageDto {
  @StringField()
  @AutoMap()
  name: string;

  @StringField()
  @AutoMap()
  unit: string;

  @NumberField()
  @AutoMap()
  total: number;
}

export class PackageDto {
  @StringField()
  @AutoMap()
  guid: string;

  @StringField()
  @AutoMap()
  sku: string;

  @StringField()
  @AutoMap()
  name: string;

  @NumberField()
  @AutoMap()
  price: number;

  @NumberField()
  @AutoMap()
  usageDuration: number;

  /// List mail users
  @StringFieldOptional({ isArray: true, each: true })
  @AutoMap(() => [String])
  targets?: string[];

  @StringFieldOptional()
  @AutoMap()
  details?: string;

  @EnumField(() => PackageStatus)
  @AutoMap()
  status: PackageStatus;

  @StringFieldOptional({ isArray: true, each: true })
  @AutoMap(() => [String])
  stationIds?: string[];

  @ClassFieldOptional(() => PackageVoucherDto, { isArray: true, each: true })
  @AutoMap(() => [PackageVoucherDto])
  vouchers?: PackageVoucherDto[];

  @ClassFieldOptional(() => InvoicePackageDto, { isArray: true, each: true })
  @AutoMap(() => [InvoicePackageDto])
  invoiceInformations?: InvoicePackageDto[];

  @StringFieldOptional({ isArray: true, each: true })
  @AutoMap(() => [String])
  blacklist?: string[];

  @StringFieldOptional({ isArray: true, each: true })
  @AutoMap(() => [String])
  event?: string[];
}
