import { AutoMap } from '@automapper/classes';
import { Column, Entity, OneToMany } from 'typeorm';

import { AbstractEntity } from '../../../common/entities/abstract.entity';
import { Translation } from '../../../common/entities/translation.entity';
import { Localizable } from '../../../decorators/localizable.decorator';
import { ILocalizableObject } from '../../../shared/services/localize.service';
import { DeviceAttentionEntity } from './device-attention.entity';

@Entity({ name: 'attentions', synchronize: false })
export class AttentionEntity
  extends AbstractEntity
  implements ILocalizableObject
{
  @Column()
  @AutoMap()
  @Localizable()
  name!: string;

  @Column({ nullable: true })
  @AutoMap()
  featureImageUrl?: string;

  @Column('jsonb')
  @AutoMap(() => Translation)
  translations?: Translation;

  @OneToMany(
    () => DeviceAttentionEntity,
    (e: DeviceAttentionEntity) => e.attention,
  )
  deviceAttentions?: DeviceAttentionEntity[];
}
