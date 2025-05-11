import { AutoMap } from '@automapper/classes';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'wards', synchronize: false })
export class WardEntity {
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
  districtCode: string;

  @Column({ nullable: true })
  @AutoMap()
  districtName: string;

  @Column({ nullable: true })
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
