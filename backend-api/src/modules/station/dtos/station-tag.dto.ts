import { AutoMap } from '@automapper/classes';

import { StringField, StringFieldOptional } from '../../../decorators';

export class StationTagDto {
  @AutoMap()
  @StringField()
  name!: string;

  @StringFieldOptional()
  @AutoMap()
  color?: string;
}
