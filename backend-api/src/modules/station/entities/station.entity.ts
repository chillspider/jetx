import { AutoMap } from '@automapper/classes';
import { Column, Entity, OneToMany, OneToOne } from 'typeorm';

import { AbstractEntity } from '../../../common/entities/abstract.entity';
import { VirtualColumn } from '../../../decorators';
import { DeviceEntity } from '../../device/entities/device.entity';
import { StationMetadataDto } from '../dtos/station-metadata.dto';
import { StationTagDto } from '../dtos/station-tag.dto';
import { StationStatus } from '../enums/station-status.enum';
import { StationLocationEntity } from './station-location.entity';

@Entity({ name: 'stations', synchronize: false })
export class StationEntity extends AbstractEntity {
  @Column()
  @AutoMap()
  name!: string;

  @Column({ nullable: true })
  @AutoMap()
  description?: string;

  @Column({ default: StationStatus.ACTIVE })
  @AutoMap()
  status?: StationStatus;

  @Column({ nullable: true })
  @AutoMap()
  featureImageUrl?: string;

  @Column({ type: 'jsonb', nullable: true })
  @AutoMap(() => [String])
  images?: string[];

  @Column({ type: 'jsonb', nullable: true })
  @AutoMap(() => [StationTagDto])
  tags?: StationTagDto[];

  @OneToOne(() => StationLocationEntity, (e) => e.station, { cascade: true })
  @AutoMap(() => StationLocationEntity)
  location!: StationLocationEntity;

  @OneToMany(() => DeviceEntity, (e) => e.station)
  @AutoMap(() => [DeviceEntity])
  devices?: DeviceEntity[];

  @Column({ type: 'jsonb', nullable: true })
  @AutoMap(() => StationMetadataDto)
  data?: StationMetadataDto;

  // ! Virtual column
  @VirtualColumn()
  @AutoMap()
  distance?: number;
}
