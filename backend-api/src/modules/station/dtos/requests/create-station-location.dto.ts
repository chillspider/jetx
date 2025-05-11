import { AutoMap } from '@automapper/classes';

import { NumberField, StringField } from '../../../../decorators';

export class CreateStationLocationDto {
  @StringField()
  @AutoMap()
  city!: string;

  @StringField()
  @AutoMap()
  cityId!: string;

  @StringField()
  @AutoMap()
  district!: string;

  @StringField()
  @AutoMap()
  districtId!: string;

  @StringField()
  @AutoMap()
  ward!: string;

  @StringField()
  @AutoMap()
  wardId!: string;

  @StringField()
  @AutoMap()
  address!: string;

  @NumberField()
  @AutoMap()
  latitude!: number;

  @NumberField()
  @AutoMap()
  longitude!: number;
}
