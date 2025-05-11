import { AutoMap } from '@automapper/classes';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'countries', synchronize: false })
export class CountryEntity {
  @PrimaryGeneratedColumn('increment')
  @AutoMap()
  id: number;

  @Column({ length: 10 })
  @AutoMap()
  code: string;

  @Column({ length: 100 })
  @AutoMap()
  name: string;

  @CreateDateColumn()
  @AutoMap()
  createdAt?: Date;

  @UpdateDateColumn()
  @AutoMap()
  updatedAt?: Date;
}
