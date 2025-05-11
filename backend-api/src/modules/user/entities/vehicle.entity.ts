import { AutoMap } from '@automapper/classes';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

import { AbstractEntity } from '../../../common/entities/abstract.entity';
import { UserEntity } from './user.entity';

@Entity({ name: 'vehicles', synchronize: false })
export class VehicleEntity extends AbstractEntity {
  @Column({ type: 'uuid' })
  @AutoMap()
  userId!: string;

  @Column({ nullable: true })
  @AutoMap()
  brand?: string;

  @Column({ nullable: true })
  @AutoMap()
  model?: string;

  @Column()
  @AutoMap()
  numberPlate!: string;

  @Column('int', { default: 0 })
  @AutoMap()
  seatCount!: number;

  @Column({ nullable: true })
  @AutoMap()
  color?: string;

  @Column({ nullable: true })
  @AutoMap()
  featureImageUrl?: string;

  @Column({ default: false })
  @AutoMap()
  isDefault!: boolean;

  @ManyToOne(() => UserEntity, (e) => e.vehicles, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  @AutoMap(() => UserEntity)
  user?: UserEntity;
}
