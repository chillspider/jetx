import { AutoMap } from '@automapper/classes';

import {
  ClassFieldOptional,
  NumberField,
  StringField,
  StringFieldOptional,
  UUIDField,
} from '../../../decorators';
import { ModeMetadata } from './mode-metadata.dto';

export class ModeDto {
  @UUIDField()
  @AutoMap()
  id: string;

  @StringField()
  @AutoMap()
  name!: string;

  @StringFieldOptional()
  @AutoMap()
  description?: string;

  @StringField()
  @AutoMap()
  code!: string;

  @ClassFieldOptional(() => ModeMetadata)
  @AutoMap(() => ModeMetadata)
  metadata?: ModeMetadata;

  @UUIDField()
  @AutoMap()
  productId!: string;

  @NumberField()
  @AutoMap()
  price: number;

  @AutoMap()
  originPrice: number;
}

export class ModeAndProductDto extends ModeDto {
  @StringField()
  @AutoMap()
  productName: string;

  @StringField()
  @AutoMap()
  stationId: string;
}
