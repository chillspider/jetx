import { AutoMap } from '@automapper/classes';

import {
  NumberField,
  StringFieldOptional,
  UUIDField,
} from '../../../decorators';

export class OrderDetectorDto {
  @UUIDField()
  @AutoMap()
  id: string;

  @NumberField()
  @AutoMap()
  incrementId: number;

  @StringFieldOptional()
  @AutoMap()
  customerId?: string;

  @StringFieldOptional()
  @AutoMap()
  customerName?: string;

  @StringFieldOptional()
  @AutoMap()
  customerEmail?: string;

  @StringFieldOptional()
  @AutoMap()
  customerPhone?: string;

  @StringFieldOptional()
  @AutoMap()
  deviceId?: string;

  @StringFieldOptional()
  @AutoMap()
  deviceName?: string;

  @StringFieldOptional()
  @AutoMap()
  deviceNo?: string;
}
