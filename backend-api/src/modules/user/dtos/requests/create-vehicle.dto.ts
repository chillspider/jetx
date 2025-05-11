import { AutoMap } from '@automapper/classes';

import {
  BooleanField,
  NumberField,
  StringField,
  StringFieldOptional,
} from '../../../../decorators';

export class CreateVehicleDto {
  @StringFieldOptional()
  @AutoMap()
  brand?: string;

  @StringFieldOptional()
  @AutoMap()
  model?: string;

  @StringField()
  @AutoMap()
  numberPlate!: string;

  @NumberField()
  @AutoMap()
  seatCount!: number;

  @StringFieldOptional()
  @AutoMap()
  color?: string;

  @BooleanField()
  @AutoMap()
  isDefault!: boolean;
}

export class UpdateVehicleDto extends CreateVehicleDto {
  @StringField()
  @AutoMap()
  id!: string;

  @StringFieldOptional()
  @AutoMap()
  featureImageUrl?: string;
}
