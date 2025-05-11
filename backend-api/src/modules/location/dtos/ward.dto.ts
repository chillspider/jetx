import { AutoMap } from '@automapper/classes';

import { StringField } from '../../../decorators';

export class WardDto {
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
  districtCode: string;

  @StringField()
  @AutoMap()
  districtName: string;

  @StringField()
  @AutoMap()
  cityCode: string;

  @StringField()
  @AutoMap()
  cityName: string;
}
