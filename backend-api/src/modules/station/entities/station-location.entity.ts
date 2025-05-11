import { AutoMap } from '@automapper/classes';
import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';

import { AbstractEntity } from '../../../common/entities/abstract.entity';
import { StationEntity } from './station.entity';

@Entity({ name: 'station_locations', synchronize: false })
export class StationLocationEntity extends AbstractEntity {
  @Column({ type: 'uuid' })
  @AutoMap()
  stationId!: string;

  @Column()
  @AutoMap()
  city!: string;

  @Column()
  @AutoMap()
  cityId!: string;

  @Column()
  @AutoMap()
  district!: string;

  @Column()
  @AutoMap()
  districtId!: string;

  @Column()
  @AutoMap()
  ward!: string;

  @Column()
  @AutoMap()
  wardId!: string;

  @Column({ nullable: true })
  @AutoMap()
  address?: string;

  @Column({ type: 'float' })
  @AutoMap()
  latitude!: number;

  @Column({ type: 'float' })
  @AutoMap()
  longitude!: number;

  @OneToOne(() => StationEntity, (e) => e.location, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'station_id' })
  station!: StationEntity;
}
