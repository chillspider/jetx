import { AutoMap } from '@automapper/classes';

import { StringField } from '../../../decorators';

export class CityDto {
  @StringField()
  @AutoMap()
  id: string;

  @StringField()
  @AutoMap()
  code: string;

  @StringField()
  @AutoMap()
  name: string;
}
