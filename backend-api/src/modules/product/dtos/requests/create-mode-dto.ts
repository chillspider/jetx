import { AutoMap } from '@automapper/classes';

import {
  ClassFieldOptional,
  NumberField,
  StringField,
  StringFieldOptional,
  UUIDField,
} from '../../../../decorators';
import { ModeMetadata } from '../mode-metadata.dto';

export class CreateModeDto {
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
}

export class UpdateModeDto extends CreateModeDto {
  @UUIDField()
  @AutoMap()
  id: string;
}
