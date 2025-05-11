import { AutoMap } from '@automapper/classes';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export abstract class AbstractEntity {
  @PrimaryGeneratedColumn('uuid')
  @AutoMap()
  id!: string;

  @CreateDateColumn()
  @AutoMap()
  createdAt?: Date;

  @Column({ default: null, nullable: true, type: 'uuid' })
  @AutoMap()
  createdBy?: string;

  @UpdateDateColumn()
  @AutoMap()
  updatedAt?: Date;

  @Column({ default: null, nullable: true, type: 'uuid' })
  @AutoMap()
  updatedBy?: string;

  @DeleteDateColumn({ nullable: true })
  @AutoMap()
  deletedAt?: Date;

  @Column({ default: null, nullable: true, type: 'uuid' })
  @AutoMap()
  deletedBy?: string;
}
