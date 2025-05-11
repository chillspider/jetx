import { AutoMap } from '@automapper/classes';

import { AbstractDto } from '../../../common/dto/abstract.dto';
import { BooleanFieldOptional, StringField } from '../../../decorators';

export class RoleDto extends AbstractDto {
  @StringField()
  @AutoMap()
  code!: string;

  @StringField()
  @AutoMap()
  name!: string;

  @BooleanFieldOptional()
  @AutoMap()
  isSystemRole?: boolean;
}
