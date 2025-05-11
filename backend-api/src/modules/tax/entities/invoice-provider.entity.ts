import { AutoMap } from '@automapper/classes';
import { Column, Entity } from 'typeorm';

import { AbstractEntity } from '../../../common/entities/abstract.entity';
import { EasyInvoiceSetting } from '../../easyinvoice/dtos/easy-invoice-setting.dto';
import { InvoiceProviderStatus } from '../enums/invoice-provider-status.enum';
import { InvoiceType } from '../enums/invoice-type.enum';

@Entity({ name: 'invoice_providers', synchronize: false })
export class InvoiceProviderEntity extends AbstractEntity {
  @Column({ default: InvoiceProviderStatus.INACTIVE })
  @AutoMap()
  status: InvoiceProviderStatus;

  @Column({ default: InvoiceType.EASYINVOICE })
  @AutoMap()
  type: InvoiceType;

  @Column({ type: 'jsonb', nullable: true })
  @AutoMap(() => EasyInvoiceSetting)
  config: EasyInvoiceSetting;
}
