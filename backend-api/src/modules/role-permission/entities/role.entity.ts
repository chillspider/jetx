import { AutoMap } from '@automapper/classes';
import { Column, Entity, OneToMany, Unique } from 'typeorm';

import { AbstractEntity } from '../../../common/entities/abstract.entity';
import { UserRoleEntity } from '../../user/entities/user-role.entity';
import { RolePermissionEntity } from './role-permission.entity';

@Entity({ name: 'roles', synchronize: false })
@Unique(['code'])
export class RoleEntity extends AbstractEntity {
  @Column()
  @AutoMap()
  name!: string;

  @Column()
  @AutoMap()
  code!: string;

  @Column({ nullable: true })
  isSystemRole!: boolean;

  @OneToMany(() => RolePermissionEntity, (rp) => rp.role)
  permissions?: RolePermissionEntity[];

  @OneToMany(() => UserRoleEntity, (rp) => rp.role)
  userRoles?: UserRoleEntity[];
}
