import { AutoMap } from '@automapper/classes';

import {
  EnumField,
  StringField,
  StringFieldOptional,
} from '../../../../decorators';
import { UserStatus } from '../../enums/user-status.enum';

export class UpdateUserStatusDto {
  @StringField()
  @AutoMap()
  id: string;

  @EnumField(() => UserStatus)
  @AutoMap()
  status: UserStatus;

  @StringFieldOptional()
  @AutoMap()
  reason?: string;
}
