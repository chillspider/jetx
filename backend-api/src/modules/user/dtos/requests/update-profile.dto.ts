import { AutoMap } from '@automapper/classes';

import { StringFieldOptional } from '../../../../decorators';

export class UpdateProfileDto {
  @StringFieldOptional({ nullable: true })
  @AutoMap()
  firstName?: string;

  @StringFieldOptional({ nullable: true })
  @AutoMap()
  lastName?: string;

  @StringFieldOptional({ nullable: true })
  @AutoMap()
  phone?: string;
}
