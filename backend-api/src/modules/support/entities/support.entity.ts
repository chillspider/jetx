import { AutoMap } from '@automapper/classes';
import { Column, Entity } from 'typeorm';

import { AbstractEntity } from '../../../common/entities/abstract.entity';
import { SupportDataDto } from '../dtos/support-data.dto';
import { SupportStatus } from '../enums/support-status.enum';

@Entity({ name: 'supports', synchronize: false })
export class SupportEntity extends AbstractEntity {
  @Column({ type: 'uuid', nullable: true })
  @AutoMap()
  customerId?: string;

  @Column()
  @AutoMap()
  customerEmail: string;

  @Column({ nullable: true })
  @AutoMap()
  customerName?: string;

  @Column({ nullable: true })
  @AutoMap()
  customerPhone?: string;

  @Column({ nullable: true })
  @AutoMap()
  orderId?: string;

  @Column({ nullable: true, length: 200 })
  @AutoMap()
  title?: string;

  @Column({ nullable: true, length: 500 })
  @AutoMap()
  content?: string;

  @Column({ type: 'jsonb', nullable: true })
  @AutoMap(() => [String])
  images?: string[];

  @Column({ default: SupportStatus.OPEN })
  @AutoMap()
  status: SupportStatus;

  @Column({ type: 'jsonb', nullable: true })
  @AutoMap(() => SupportDataDto)
  data?: SupportDataDto;

  @Column({ nullable: true })
  @AutoMap()
  nflowId?: string;
}
