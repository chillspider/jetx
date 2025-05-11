import { AutoMap } from '@automapper/classes';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'districts', synchronize: false })
export class DistrictEntity {
  @PrimaryGeneratedColumn('increment')
  @AutoMap()
  id: string;

  @Column()
  @AutoMap()
  code: string;

  @Column()
  @AutoMap()
  name: string;

  @Column()
  @AutoMap()
  cityCode: string;

  @Column({ nullable: true })
  @AutoMap()
  cityName: string;

  @CreateDateColumn()
  @AutoMap()
  createdAt?: Date;

  @UpdateDateColumn()
  @AutoMap()
  updatedAt?: Date;
}
