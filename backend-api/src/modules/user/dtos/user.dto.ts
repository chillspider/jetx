import { AutoMap } from '@automapper/classes';

import { AbstractDto } from '../../../common/dto/abstract.dto';
import {
  BooleanField,
  ClassFieldOptional,
  EmailFieldOptional,
  EnumField,
  EnumFieldOptional,
  StringFieldOptional,
} from '../../../decorators';
import { AuthProvider } from '../../auth/enums/auth-provider.enum';
import { UserMembershipDto } from '../../membership/dtos/user-membership.dto';
import { UserStatus } from '../enums/user-status.enum';

export class UserDto extends AbstractDto {
  @StringFieldOptional({ nullable: true })
  @AutoMap()
  firstName?: string;

  @StringFieldOptional({ nullable: true })
  @AutoMap()
  lastName?: string;

  @StringFieldOptional({ nullable: true })
  @AutoMap()
  fullName?: string;

  @EmailFieldOptional({ nullable: true })
  @AutoMap()
  email?: string;

  @StringFieldOptional({ nullable: true })
  @AutoMap()
  avatar?: string;

  @StringFieldOptional({ nullable: true })
  @AutoMap()
  phone?: string;

  @EnumFieldOptional(() => AuthProvider)
  @AutoMap()
  provider?: AuthProvider;

  @StringFieldOptional({ nullable: true })
  @AutoMap()
  socialId?: string;

  @EnumField(() => UserStatus)
  @AutoMap()
  status!: UserStatus;

  @ClassFieldOptional(() => UserMembershipDto)
  @AutoMap(() => UserMembershipDto)
  userMembership: UserMembershipDto;

  @StringFieldOptional({ isArray: true, each: true })
  @AutoMap(() => [String])
  deviceTokens: string[];

  @StringFieldOptional()
  @AutoMap()
  note?: string;

  @StringFieldOptional()
  @AutoMap()
  referralCode?: string;

  @BooleanField()
  isReferred: boolean;
}
