import { AutoMap } from '@automapper/classes';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

import { AbstractEntity } from '../../../common/entities/abstract.entity';
import { RoleEntity } from './role.entity';

@Entity({ name: 'role_permissions', synchronize: false })
export class RolePermissionEntity extends AbstractEntity {
  @AutoMap()
  @Column({ type: 'uuid' })
  roleId!: string;

  @AutoMap()
  @Column()
  code!: string;

  @AutoMap()
  @Column()
  groupCode!: string;

  @ManyToOne(() => RoleEntity, (role) => role.permissions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'role_id', referencedColumnName: 'id' })
  role?: RoleEntity;
}
