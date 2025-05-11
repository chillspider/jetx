import { AutoMap } from '@automapper/classes';

import { AbstractDto } from '../../../common/dto/abstract.dto';
import { ClassField, UUIDField } from '../../../decorators';
import { RoleDto } from '../../role-permission/dtos/role.dto';
import { UserDto } from './user.dto';

export class UserRoleDto extends AbstractDto {
  @UUIDField()
  @AutoMap()
  userId?: string;

  @UUIDField()
  @AutoMap()
  roleId?: string;

  @ClassField(() => UserDto)
  @AutoMap()
  user!: UserDto;

  @ClassField(() => RoleDto)
  @AutoMap(() => RoleDto)
  role!: RoleDto;
}
