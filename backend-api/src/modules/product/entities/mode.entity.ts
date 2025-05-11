import { AutoMap } from '@automapper/classes';
import { Column, Entity, OneToMany } from 'typeorm';

import { AbstractEntity } from '../../../common/entities/abstract.entity';
import { ColumnNumericTransformer } from '../../../common/transformers/numeric';
import { ToInt } from '../../../decorators';
import { StationModeEntity } from '../../station/entities/station-mode.entity';
import { ModeMetadata } from '../dtos/mode-metadata.dto';

@Entity({ name: 'modes', synchronize: false })
export class ModeEntity extends AbstractEntity {
  @Column()
  @AutoMap()
  name!: string;

  @Column({ nullable: true })
  @AutoMap()
  description?: string;

  @Column()
  @AutoMap()
  code!: string;

  @Column('jsonb', { nullable: true })
  @AutoMap()
  metadata?: ModeMetadata;

  @Column({ type: 'uuid', nullable: true })
  @AutoMap()
  productId?: string;

  @Column('bigint', {
    default: 0,
    transformer: new ColumnNumericTransformer(),
  })
  @ToInt()
  @AutoMap()
  price: number;

  @OneToMany(() => StationModeEntity, (e: StationModeEntity) => e.mode)
  @AutoMap(() => [StationModeEntity])
  stationModes: StationModeEntity[];
}
