import { AutoMap } from '@automapper/classes';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'cities', synchronize: false })
export class CityEntity {
  @PrimaryGeneratedColumn('increment')
  @AutoMap()
  id: string;

  @Column()
  @AutoMap()
  code: string;

  @Column()
  @AutoMap()
  name: string;

  @CreateDateColumn()
  @AutoMap()
  createdAt?: Date;

  @UpdateDateColumn()
  @AutoMap()
  updatedAt?: Date;
}
