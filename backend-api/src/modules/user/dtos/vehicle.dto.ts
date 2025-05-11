import { AutoMap } from '@automapper/classes';

import { AbstractDto } from '../../../common/dto/abstract.dto';
import {
  BooleanField,
  StringField,
  StringFieldOptional,
} from '../../../decorators';

export class VehicleDto extends AbstractDto {
  @StringField()
  @AutoMap()
  userId!: string;

  @StringFieldOptional()
  @AutoMap()
  brand?: string;

  @StringFieldOptional()
  @AutoMap()
  model?: string;

  @StringField()
  @AutoMap()
  numberPlate!: string;

  @StringField()
  @AutoMap()
  seatCount!: number;

  @StringFieldOptional()
  @AutoMap()
  color?: string;

  @StringFieldOptional()
  @AutoMap()
  featureImageUrl?: string;

  @BooleanField()
  @AutoMap()
  isDefault!: boolean;
}
