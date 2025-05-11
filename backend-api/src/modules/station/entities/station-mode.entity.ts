import { AutoMap } from '@automapper/classes';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

import { AbstractEntity } from '../../../common/entities/abstract.entity';
import { ColumnNumericTransformer } from '../../../common/transformers/numeric';
import { ToInt } from '../../../decorators';
import { ModeEntity } from '../../product/entities/mode.entity';
import { StationEntity } from './station.entity';

@Entity({ name: 'station_modes', synchronize: false })
export class StationModeEntity extends AbstractEntity {
  @Column({ type: 'uuid' })
  @AutoMap()
  stationId: string;

  @Column({ type: 'uuid' })
  @AutoMap()
  modeId: string;

  @Column('bigint', {
    default: 0,
    transformer: new ColumnNumericTransformer(),
  })
  @ToInt()
  @AutoMap()
  price: number;

  @ManyToOne(() => StationEntity, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'station_id' })
  @AutoMap(() => StationEntity)
  station: StationEntity;

  @ManyToOne(() => ModeEntity, (e) => e.stationModes, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'mode_id' })
  @AutoMap(() => ModeEntity)
  mode: ModeEntity;
}
