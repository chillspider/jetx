import { AutoMap } from '@automapper/classes';

import { AbstractDto } from '../../../common/dto/abstract.dto';
import { StringField } from '../../../decorators';

export class RolePermissionDto extends AbstractDto {
  @StringField()
  @AutoMap()
  roleId!: string;

  @StringField()
  @AutoMap()
  code!: string;

  @StringField()
  @AutoMap()
  groupCode?: string;
}
