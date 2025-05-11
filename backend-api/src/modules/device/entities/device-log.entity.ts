import { AutoMap } from '@automapper/classes';
import { Column, Entity } from 'typeorm';

import { AbstractEntity } from '../../../common/entities/abstract.entity';
import { DeviceLogEnum } from '../enums/device-log.enum';

@Entity({ name: 'device_logs', synchronize: false })
export class DeviceLogEntity extends AbstractEntity {
  @Column()
  @AutoMap()
  type: DeviceLogEnum;

  @Column()
  @AutoMap()
  deviceNo: string;

  @Column({ nullable: true })
  @AutoMap()
  orderId?: string;

  @AutoMap()
  @Column({ type: 'json', default: '{}' })
  data: Record<string, unknown>;

  @AutoMap()
  @Column({ type: 'json', default: '{}' })
  body: Record<string, unknown>;
}
