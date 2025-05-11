import { AutoMap } from '@automapper/classes';
import { Column, Entity, Generated, OneToMany, OneToOne } from 'typeorm';

import { AbstractEntity } from '../../../common/entities/abstract.entity';
import { ColumnNumericTransformer } from '../../../common/transformers/numeric';
import { ToInt } from '../../../decorators';
import { VoucherLocationDto } from '../../voucher/dtos/voucher-location.dto';
import { VoucherValidityDto } from '../../voucher/dtos/voucher-validity.dto';
import { B2bVoucherStatus } from '../enums/b2b-voucher.enum';
import { B2bVoucherCodeEntity } from './b2b-voucher-code.entity';
import { B2bVoucherInvoiceEntity } from './b2b-voucher-invoice.entity';

@Entity({ name: 'b2b_vouchers', synchronize: false })
export class B2bVoucherEntity extends AbstractEntity {
  @Column()
  @AutoMap()
  name: string;

  @Column()
  @AutoMap()
  description: string;

  @Column({ default: B2bVoucherStatus.ACTIVE })
  @AutoMap()
  status: B2bVoucherStatus;

  @Column()
  @AutoMap()
  codeQuantity: number;

  @Column()
  @AutoMap()
  voucherName: string;

  @Column({ nullable: true })
  @AutoMap()
  voucherDescription?: string;

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

  @Column({ nullable: true, type: 'jsonb', default: {} })
  @AutoMap(() => VoucherValidityDto)
  validity?: VoucherValidityDto;

  @Column({ nullable: true })
  @AutoMap()
  nflowId?: string;

  @Column()
  @Generated('increment')
  @AutoMap()
  incrementId: number;

  @OneToOne(() => B2bVoucherInvoiceEntity, (e) => e.b2bVoucher, {
    cascade: true,
  })
  @AutoMap(() => B2bVoucherInvoiceEntity)
  invoice?: B2bVoucherInvoiceEntity;

  @OneToMany(() => B2bVoucherCodeEntity, (e) => e.b2bVoucher)
  @AutoMap(() => [B2bVoucherCodeEntity])
  voucherCodes?: B2bVoucherCodeEntity[];
}
