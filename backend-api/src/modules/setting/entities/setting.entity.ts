import { AutoMap } from '@automapper/classes';
import { Column, Entity } from 'typeorm';

import { AbstractEntity } from '../../../common/entities/abstract.entity';
import { SettingKey } from '../enums/setting-key.enum';
import { SettingType } from '../enums/setting-type.enum';

@Entity({ name: 'settings', synchronize: false })
export class SettingEntity extends AbstractEntity {
  @Column({ unique: true })
  @AutoMap()
  key: SettingKey;

  @Column({ default: '' })
  @AutoMap()
  value: string;

  @Column({ default: SettingType.String })
  @AutoMap()
  type: SettingType;

  @Column({ nullable: true })
  @AutoMap()
  group?: string;
}
