import { AutoMap } from '@automapper/classes';
import { Column, Entity, JoinColumn, ManyToOne, Unique } from 'typeorm';

import { AbstractEntity } from '../../../common/entities/abstract.entity';
import { AttentionEntity } from './attention.entity';
import { DeviceEntity } from './device.entity';

@Entity({ name: 'device_attentions', synchronize: false })
@Unique(['deviceId', 'attentionId'])
export class DeviceAttentionEntity extends AbstractEntity {
  @Column({ type: 'uuid' })
  @AutoMap()
  deviceId!: string;

  @Column({ type: 'uuid' })
  @AutoMap()
  attentionId!: string;

  @ManyToOne(() => DeviceEntity, (d) => d.deviceAttentions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'device_id', referencedColumnName: 'id' })
  device!: DeviceEntity;

  @ManyToOne(() => AttentionEntity, (a) => a.deviceAttentions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'attention_id', referencedColumnName: 'id' })
  attention!: AttentionEntity;
}
