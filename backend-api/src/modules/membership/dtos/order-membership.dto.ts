import { AutoMap } from '@automapper/classes';

import {
  ClassField,
  ClassFieldOptional,
  DateField,
  EnumField,
  UUIDField,
} from '../../../decorators';
import { MembershipStatus } from '../enums/membership-status.enum';
import { MembershipDto } from './membership.dto';
import { MembershipCondition } from './membership-condition.dto';

export class OrderMembershipDto {
  @UUIDField()
  @AutoMap()
  id: string;

  @DateField()
  @AutoMap()
  startAt: Date;

  @DateField()
  @AutoMap()
  endAt: Date;

  @EnumField(() => MembershipStatus)
  @AutoMap()
  status: MembershipStatus;

  @ClassFieldOptional(() => MembershipCondition)
  @AutoMap(() => [MembershipCondition])
  condition?: MembershipCondition;

  @ClassField(() => MembershipDto)
  @AutoMap(() => MembershipDto)
  membership: MembershipDto;
}
