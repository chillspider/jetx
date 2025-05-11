import { Column, Entity } from 'typeorm';

import { AbstractEntity } from '../../../common/entities/abstract.entity';
import { VOUCHER_USAGE_DURATION } from '../../../constants/config';
import {
  ClassField,
  NumberField,
  StringField,
  StringFieldOptional,
} from '../../../decorators';
import { PackageVoucherDto } from '../dtos/package.dto';
import { WashPackageStatus } from '../enums/voucher-package-status.enum';

@Entity({ name: 'package_vouchers', synchronize: false })
export class PackageVoucherEntity extends AbstractEntity {
  @Column({ type: 'uuid' })
  @StringField()
  orderId: string;

  @Column()
  @StringField()
  packageId: string;

  @Column()
  @StringField()
  status: WashPackageStatus;

  @Column({ type: 'jsonb' })
  @StringFieldOptional({ isArray: true })
  stationIds?: string[];

  @Column({ type: 'jsonb' })
  @ClassField(() => PackageVoucherDto)
  voucher: PackageVoucherDto;

  @Column({ nullable: true })
  @StringField()
  voucherId?: string;

  @Column({ default: VOUCHER_USAGE_DURATION })
  @NumberField()
  usageDuration: number;

  @Column({ default: 0 })
  @NumberField()
  attempt: number;
}
