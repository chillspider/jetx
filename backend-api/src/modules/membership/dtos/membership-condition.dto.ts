import { StringFieldOptional } from '../../../decorators';

export class MembershipCondition {
  @StringFieldOptional({ isArray: true, each: true })
  vehicleIds: string[] = [];
}
