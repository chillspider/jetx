import { AutoMap } from '@automapper/classes';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

import { AbstractEntity } from '../../../common/entities/abstract.entity';
import { B2bVoucherCodeStatus } from '../enums/b2b-voucher-code.enum';
import { B2bVoucherEntity } from './b2b-voucher.entity';

@Entity({ name: 'b2b_voucher_codes', synchronize: false })
export class B2bVoucherCodeEntity extends AbstractEntity {
  @Column({ unique: true })
  @AutoMap()
  code: string;

  @Column({ type: 'uuid' })
  @AutoMap()
  b2bVoucherId: string;

  @Column({ type: 'uuid', nullable: true })
  @AutoMap()
  voucherId?: string;

  @Column({ default: B2bVoucherCodeStatus.AVAILABLE })
  @AutoMap()
  status: B2bVoucherCodeStatus;

  @Column({ nullable: true })
  @AutoMap()
  redeemedAt?: Date;

  @Column({ type: 'uuid', nullable: true })
  @AutoMap()
  redeemedBy?: string;

  @ManyToOne(() => B2bVoucherEntity, (e) => e.voucherCodes, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'b2b_voucher_id' })
  @AutoMap(() => B2bVoucherEntity)
  b2bVoucher?: B2bVoucherEntity;
}
