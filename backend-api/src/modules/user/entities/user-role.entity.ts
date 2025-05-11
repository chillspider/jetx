import { AutoMap } from '@automapper/classes';
import { Column, Entity, JoinColumn, ManyToOne, Unique } from 'typeorm';

import { AbstractEntity } from '../../../common/entities/abstract.entity';
import { RoleEntity } from '../../role-permission/entities/role.entity';
import { UserEntity } from './user.entity';

@Entity({ name: 'user_roles', synchronize: false })
@Unique(['userId', 'roleId'])
export class UserRoleEntity extends AbstractEntity {
  @Column({ type: 'uuid' })
  @AutoMap()
  userId!: string;

  @Column({ type: 'uuid' })
  @AutoMap()
  roleId!: string;

  @ManyToOne(() => UserEntity, (user) => user.userRoles, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
  user?: UserEntity;

  @ManyToOne(() => RoleEntity, (role) => role.userRoles, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'role_id', referencedColumnName: 'id' })
  role?: RoleEntity;
}
