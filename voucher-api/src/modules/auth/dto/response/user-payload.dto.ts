import { AutoMap } from '@automapper/classes';

import { AbstractDto } from '../../../../common/dto/abstract.dto';
import { AuthProvider } from '../../../../common/enums/auth-provider.enum';
import { UserStatus } from '../../../../common/enums/user-status.enum';
import {
  EmailFieldOptional,
  EnumField,
  EnumFieldOptional,
  StringFieldOptional,
} from '../../../../decorators';

export class UserPayloadDto extends AbstractDto {
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

  @StringFieldOptional({ nullable: true, isArray: true })
  @AutoMap()
  roles?: string[];

  @StringFieldOptional({ nullable: true, isArray: true })
  @AutoMap()
  rights?: string[];
}
