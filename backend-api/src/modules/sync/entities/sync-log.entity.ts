import { AutoMap } from '@automapper/classes';
import { Column, Entity } from 'typeorm';

import { AbstractEntity } from '../../../common/entities/abstract.entity';
import { SyncActionEnum } from '../../../constants/action';
import { SyncTypeEnum } from '../enums/sync-action.enum';

@Entity({ name: 'sync_logs', synchronize: false })
export class SyncLogEntity extends AbstractEntity {
  @Column({ type: 'uuid' })
  @AutoMap()
  objectId: string;

  @Column()
  @AutoMap()
  type: SyncTypeEnum;

  @Column()
  @AutoMap()
  action: SyncActionEnum;

  @Column({ type: 'jsonb', default: {} })
  @AutoMap()
  value: Record<any, any>;

  @Column({ default: false })
  @AutoMap()
  synced: boolean;

  @Column({ nullable: true })
  @AutoMap()
  syncedAt?: Date;
}
