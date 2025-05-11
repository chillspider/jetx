import { AutoMap } from '@automapper/classes';

import {
  DateField,
  StringField,
  StringFieldOptional,
} from '../../../decorators';

export class EventValidityDto {
  @StringField()
  @AutoMap()
  guid: string;

  @StringFieldOptional()
  @AutoMap()
  name?: string;

  @StringFieldOptional()
  @AutoMap()
  description?: string;

  @DateField()
  @AutoMap()
  start: Date;

  @DateField()
  @AutoMap()
  end: Date;
}
