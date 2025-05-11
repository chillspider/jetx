import { AutoMap } from '@automapper/classes';

import {
  EnumField,
  NumberField,
  StringField,
  StringFieldOptional,
} from '../../../../decorators';
import { MembershipType } from '../../enums/membership-type.enum';

export class CreateMembershipDto {
  @StringField()
  @AutoMap()
  name: string;

  @StringFieldOptional()
  @AutoMap()
  description?: string;

  @NumberField()
  @AutoMap()
  cost: number;

  @EnumField(() => MembershipType)
  @AutoMap()
  type: MembershipType;

  @NumberField()
  @AutoMap()
  duration: number;
}

export class UpdateMembershipDto extends CreateMembershipDto {
  @StringField()
  @AutoMap()
  id!: string;
}
