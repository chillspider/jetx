import { AutoMap } from '@automapper/classes';
import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';

import { AbstractEntity } from '../../../common/entities/abstract.entity';
import { B2bVoucherInvoiceItemDto } from '../dtos/b2b-voucher-invoice.dto';
import { B2bVoucherEntity } from './b2b-voucher.entity';

@Entity({ name: 'b2b_voucher_invoices', synchronize: false })
export class B2bVoucherInvoiceEntity extends AbstractEntity {
  @Column({ type: 'uuid' })
  @AutoMap()
  b2bVoucherId: string;

  @Column({ nullable: true })
  @AutoMap()
  code?: string;

  @Column({ nullable: true })
  @AutoMap()
  name?: string;

  @Column({ nullable: true })
  @AutoMap()
  billingName?: string;

  @Column({ nullable: true })
  @AutoMap()
  address?: string;

  @Column({ nullable: true, type: 'jsonb', default: [] })
  @AutoMap(() => [B2bVoucherInvoiceItemDto])
  items?: B2bVoucherInvoiceItemDto[];

  @OneToOne(() => B2bVoucherEntity, (e) => e.invoice, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'b2b_voucher_id' })
  b2bVoucher!: B2bVoucherEntity;
}
