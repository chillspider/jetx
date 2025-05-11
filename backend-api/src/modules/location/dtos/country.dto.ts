import { AutoMap } from '@automapper/classes';

import { StringField } from '../../../decorators';

export class CountryDto {
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
