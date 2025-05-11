import { AutoMap } from '@automapper/classes';

import { AuthProvider } from '../../auth/enums/auth-provider.enum';
import { UserStatus } from '../../user/enums/user-status.enum';

export class SyncUserDto {
  @AutoMap()
  id: string;

  @AutoMap()
  firstName?: string;

  @AutoMap()
  lastName?: string;

  @AutoMap()
  email?: string;

  @AutoMap()
  avatar?: string;

  @AutoMap()
  phone?: string;

  @AutoMap()
  provider?: AuthProvider;

  @AutoMap()
  status!: UserStatus;

  @AutoMap()
  note?: string;

  @AutoMap()
  referralCode?: string;
}
