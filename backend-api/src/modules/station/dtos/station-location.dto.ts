import { AutoMap } from '@automapper/classes';

import { AbstractDto } from '../../../common/dto/abstract.dto';
import { NumberField, StringField } from '../../../decorators';

export class StationLocationDto extends AbstractDto {
  @StringField()
  @AutoMap()
  stationId!: string;

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
