import { AutoMap } from '@automapper/classes';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

import { AbstractEntity } from '../../../common/entities/abstract.entity';
import { ColumnNumericTransformer } from '../../../common/transformers/numeric';
import { ToInt } from '../../../decorators';
import { InvoiceEntity } from './invoice.entity';

@Entity({ name: 'invoice_items', synchronize: false })
export class InvoiceItemEntity extends AbstractEntity {
  @Column({ nullable: true })
  @AutoMap()
  sku: string;

  @Column({ nullable: true })
  @AutoMap()
  name: string;

  @Column({ type: 'numeric', transformer: new ColumnNumericTransformer() })
  @ToInt()
  @AutoMap()
  price: number;

  @Column({ type: 'numeric', transformer: new ColumnNumericTransformer() })
  @ToInt()
  @AutoMap()
  taxRate: number;

  @Column()
  @AutoMap()
  unit: string;

  @Column({ type: 'numeric', transformer: new ColumnNumericTransformer() })
  @ToInt()
  @AutoMap()
  discountAmount: number;

  @Column()
  @AutoMap()
  qty: number;

  @Column({ name: 'invoice_id' })
  @AutoMap()
  invoiceId: string;

  @ManyToOne(() => InvoiceEntity, (invoice) => invoice.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'invoice_id' })
  invoice?: InvoiceEntity;
}
