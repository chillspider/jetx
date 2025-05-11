import { AutoMap } from '@automapper/classes';

import { AbstractDto } from '../../../common/dto/abstract.dto';
import {
  ClassField,
  ClassFieldOptional,
  DateField,
  EnumField,
  StringField,
} from '../../../decorators';
import { MembershipStatus } from '../enums/membership-status.enum';
import { MembershipDto } from './membership.dto';
import { MembershipCondition } from './membership-condition.dto';

export class UserMembershipDto extends AbstractDto {
  @DateField()
  @AutoMap()
  startAt: Date;

  @DateField()
  @AutoMap()
  endAt: Date;

  @EnumField(() => MembershipStatus)
  @AutoMap()
  status: MembershipStatus;

  @StringField()
  @AutoMap()
  userId: string;

  @StringField()
  @AutoMap()
  membershipId: string;

  @ClassFieldOptional(() => MembershipCondition)
  @AutoMap(() => [MembershipCondition])
  condition?: MembershipCondition;

  @ClassField(() => MembershipDto)
  @AutoMap(() => MembershipDto)
  membership: MembershipDto;
}
