import { AutoMap } from '@automapper/classes';
import { Column, Entity, JoinColumn, OneToMany, OneToOne } from 'typeorm';

import { AbstractEntity } from '../../../common/entities/abstract.entity';
import { ColumnNumericTransformer } from '../../../common/transformers/numeric';
import { ToInt } from '../../../decorators';
import { InvoiceIssueType } from '../enums/invoice-issue-type.enum';
import { InvoiceStatusEnum } from '../enums/invoice-status.enum';
import { InvoiceType } from '../enums/invoice-type.enum';
import { InvoiceBillingEntity } from './invoice-billing.entity';
import { InvoiceItemEntity } from './invoice-item.entity';

@Entity({ name: 'invoices', synchronize: false })
export class InvoiceEntity extends AbstractEntity {
  @Column({ nullable: true })
  @AutoMap()
  provider?: InvoiceType;

  @Column()
  @AutoMap()
  orderId: string;

  @Column()
  @AutoMap()
  orderIncrementId: number;

  @Column({ nullable: true, default: InvoiceStatusEnum.Draft })
  @AutoMap()
  status: InvoiceStatusEnum;

  @Column({ type: 'timestamp with time zone' })
  @AutoMap()
  issuedDate: string;

  @Column({ nullable: true })
  @AutoMap()
  externalId?: string;

  @Column({ type: 'bigint', transformer: new ColumnNumericTransformer() })
  @ToInt()
  @AutoMap()
  totalAmount: number;

  @Column({ type: 'bigint', transformer: new ColumnNumericTransformer() })
  @ToInt()
  @AutoMap()
  discountAmount: number;

  @Column({ type: 'jsonb', nullable: true })
  @AutoMap()
  data: unknown;

  @OneToMany(() => InvoiceItemEntity, (item) => item.invoice, {
    cascade: true,
  })
  @AutoMap(() => [InvoiceItemEntity])
  items: InvoiceItemEntity[];

  @Column({ nullable: true })
  @AutoMap()
  invoiceBillingId: string;

  @Column({ default: InvoiceIssueType.ORDER })
  @AutoMap()
  issuedType: InvoiceIssueType;

  @OneToOne(() => InvoiceBillingEntity, (billing) => billing.invoice, {
    eager: false,
    cascade: true,
  })
  @JoinColumn({ name: 'invoice_billing_id' })
  @AutoMap(() => InvoiceBillingEntity)
  invoiceBilling: InvoiceBillingEntity;
}
