import { AutoMap } from '@automapper/classes';
import { Column, Entity, OneToOne } from 'typeorm';

import { AbstractEntity } from '../../../common/entities/abstract.entity';
import { InvoiceEntity } from './invoice.entity';

@Entity({ name: 'invoice_billings', synchronize: false })
export class InvoiceBillingEntity extends AbstractEntity {
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
  phone?: string;

  @Column({ nullable: true })
  @AutoMap()
  email?: string;

  @Column({ nullable: true })
  @AutoMap()
  address?: string;

  @Column({ nullable: true })
  @AutoMap()
  invoiceId: string;

  @OneToOne(() => InvoiceEntity, (invoice) => invoice.invoiceBilling)
  invoice?: InvoiceEntity;
}
