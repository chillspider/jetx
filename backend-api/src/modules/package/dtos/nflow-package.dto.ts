import { AutoMap } from '@automapper/classes';

import { PackageStatus } from '../enums/package-status.enum';
import { InvoicePackageDto } from './package.dto';

export class NflowPackageVoucherDto {
  @AutoMap()
  name: string;

  @AutoMap()
  description?: string;

  @AutoMap()
  value: number;

  @AutoMap()
  quantity?: number;
}

export class NflowPackageDto {
  @AutoMap()
  guid: string;

  @AutoMap()
  sku: string;

  @AutoMap()
  name: string;

  @AutoMap()
  pricing: number;

  @AutoMap(() => [String])
  userEligibles?: string[];

  @AutoMap()
  description?: string;

  @AutoMap()
  status: PackageStatus;

  @AutoMap(() => [String])
  stations?: string[];

  @AutoMap()
  usageDuration: number;

  @AutoMap(() => [NflowPackageVoucherDto])
  vouchers?: NflowPackageVoucherDto[];

  @AutoMap(() => [InvoicePackageDto])
  invoiceInformations?: InvoicePackageDto[];

  @AutoMap(() => [String])
  event?: string[];

  @AutoMap(() => [String])
  blacklist?: string[];

  $metadata?: {
    origin?: { status?: PackageStatus };
  };
}
