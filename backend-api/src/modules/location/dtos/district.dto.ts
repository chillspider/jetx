import { AutoMap } from '@automapper/classes';

import { StringField } from '../../../decorators';

export class DistrictDto {
  @StringField()
  @AutoMap()
  id: string;

  @StringField()
  @AutoMap()
  code: string;

  @StringField()
  @AutoMap()
  name: string;

  @StringField()
  @AutoMap()
  cityCode: string;

  @StringField()
  @AutoMap()
  cityName: string;
}
