import { AutoMap } from '@automapper/classes';

import {
  StringField,
  StringFieldOptional,
  UUIDField,
} from '../../../../decorators';

export class CreateOrderRequest {
  @StringField()
  @AutoMap()
  deviceId: string;

  @StringField()
  @AutoMap()
  modeId: string;

  @AutoMap()
  @StringFieldOptional({ nullable: true })
  voucherId?: string;

  @AutoMap()
  @StringFieldOptional()
  note?: string;
}

export class UpdateOrderRequest extends CreateOrderRequest {
  @UUIDField()
  @AutoMap()
  id: string;
}
