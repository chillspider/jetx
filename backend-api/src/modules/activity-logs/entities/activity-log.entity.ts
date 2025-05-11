import { AutoMap } from '@automapper/classes';
import { Column, Entity } from 'typeorm';

import { AbstractEntity } from '../../../common/entities/abstract.entity';
import { ActionActivityEnum } from '../enums/action-activity.enum';

@Entity({ name: 'activity_logs', synchronize: false })
export class ActivityLogEntity extends AbstractEntity {
  @Column({ type: 'uuid' })
  @AutoMap()
  objectId: string;

  @Column()
  @AutoMap()
  action: ActionActivityEnum | string;

  @Column({ type: 'jsonb', default: {} })
  @AutoMap()
  value: Record<any, any>;
}
