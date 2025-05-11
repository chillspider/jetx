import { AutoMap } from '@automapper/classes';
import { Column, Entity } from 'typeorm';

import { AbstractEntity } from '../../../common/entities/abstract.entity';
import { LineBreakFormatter } from '../../../common/transformers/linebreak';
import { ColumnNumericTransformer } from '../../../common/transformers/numeric';
import { ToInt, VirtualColumn } from '../../../decorators';
import { VoucherLocationDto } from '../dtos/voucher-location.dto';
import { VoucherMetadataDto } from '../dtos/voucher-metadata.dto';
import { VoucherValidityDto } from '../dtos/voucher-validity.dto';
import {
  VoucherIssueTypeEnum,
  VoucherModelEnum,
  VoucherProfileApplicationEnum,
  VoucherStatusEnum,
  VoucherTypeEnum,
} from '../enums/vouchers.enum';

@Entity({ name: 'vouchers', synchronize: false })
export class VoucherEntity extends AbstractEntity {
  @Column({ length: 200 })
  @AutoMap()
  name: string;

  @Column({ nullable: true, transformer: new LineBreakFormatter() })
  @AutoMap()
  description?: string;

  @Column({ default: VoucherTypeEnum.WASHING_SERVICE })
  @AutoMap()
  type: VoucherTypeEnum;

  @Column({
    default: VoucherProfileApplicationEnum.WASHING_SERVICE,
  })
  @AutoMap()
  profileApplication: VoucherProfileApplicationEnum;

  @Column({ default: VoucherModelEnum.FIXED_AMOUNT })
  @AutoMap()
  voucherModel: VoucherModelEnum;

  @Column('bigint', {
    default: 0,
    transformer: new ColumnNumericTransformer(),
  })
  @ToInt()
  @AutoMap()
  minOrderValue: number;

  @Column('bigint', {
    nullable: true,
    transformer: new ColumnNumericTransformer({ nullable: true }),
  })
  @AutoMap()
  maxDeductionValue?: number;

  @Column('bigint', {
    default: 0,
    transformer: new ColumnNumericTransformer(),
  })
  @ToInt()
  @AutoMap()
  hiddenCashValue: number;

  @Column('bigint', {
    default: 0,
    transformer: new ColumnNumericTransformer(),
  })
  @ToInt()
  @AutoMap()
  percentage: number;

  @Column({ nullable: true, type: 'timestamp with time zone' })
  @AutoMap()
  startAt?: Date;

  @Column({ nullable: true, type: 'timestamp with time zone' })
  @AutoMap()
  endAt?: Date;

  @Column({ nullable: true, type: 'jsonb', default: {} })
  @AutoMap(() => VoucherLocationDto)
  location?: VoucherLocationDto;

  @Column({ default: VoucherStatusEnum.DRAFT })
  @AutoMap()
  status: VoucherStatusEnum;

  @Column({ nullable: true, type: 'uuid' })
  @AutoMap()
  userId?: string;

  @Column({ nullable: true, type: 'uuid' })
  @AutoMap()
  orderId?: string;

  @Column({ nullable: true })
  @AutoMap()
  nflowId?: string;

  @Column({ nullable: true, type: 'jsonb', default: {} })
  @AutoMap(() => VoucherValidityDto)
  validity?: VoucherValidityDto;

  @Column({ nullable: true, type: 'jsonb', default: {} })
  @AutoMap(() => VoucherMetadataDto)
  data?: VoucherMetadataDto;

  @Column({ nullable: true })
  @AutoMap()
  issueType?: VoucherIssueTypeEnum;

  // This field is not present in the entity
  @VirtualColumn()
  @AutoMap()
  deduction?: number;
}
