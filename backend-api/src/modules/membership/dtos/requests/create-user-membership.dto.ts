import { AutoMap } from '@automapper/classes';

import { StringFieldOptional, UUIDField } from '../../../../decorators';

export class CreateUserMembershipDto {
  @UUIDField()
  @AutoMap()
  userId: string;

  @UUIDField()
  @AutoMap()
  membershipId: string;

  @StringFieldOptional({ isArray: true, each: true })
  @AutoMap(() => [String])
  vehicleIds?: string[];
}
