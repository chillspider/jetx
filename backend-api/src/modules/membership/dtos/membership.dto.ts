import { AutoMap } from '@automapper/classes';

import {
  EnumField,
  NumberField,
  StringField,
  StringFieldOptional,
  UUIDField,
} from '../../../decorators';
import { MembershipType } from '../enums/membership-type.enum';

export class MembershipDto {
  @UUIDField()
  @AutoMap()
  id!: string;

  @StringField()
  @AutoMap()
  name: string;

  @StringFieldOptional()
  @AutoMap()
  description?: string;

  @EnumField(() => MembershipType)
  @AutoMap()
  type: MembershipType;

  @NumberField()
  @AutoMap()
  duration: number;
}
