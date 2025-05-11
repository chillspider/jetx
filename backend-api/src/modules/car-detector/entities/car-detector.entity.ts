import { AutoMap } from '@automapper/classes';
import { Column, Entity } from 'typeorm';

import { AbstractEntity } from '../../../common/entities/abstract.entity';
import { CarDetectorMetadataDto } from '../dtos/car-detector-metadata.dto';

@Entity({ name: 'car_detectors', synchronize: false })
export class CarDetectorEntity extends AbstractEntity {
  @Column({ type: 'uuid' })
  @AutoMap()
  customerId!: string;

  @Column({ type: 'uuid' })
  @AutoMap()
  orderId!: string;

  @Column({ nullable: true })
  @AutoMap()
  imageUrl?: string;

  @Column({ nullable: true })
  @AutoMap()
  plateNumber?: string;

  @Column({ nullable: true })
  @AutoMap()
  brand?: string;

  @Column({ nullable: true })
  @AutoMap()
  carType?: string;

  @Column({ nullable: true })
  @AutoMap()
  color?: string;

  @Column({ type: 'jsonb', default: {}, nullable: true })
  @AutoMap(() => CarDetectorMetadataDto)
  data?: CarDetectorMetadataDto;
}
