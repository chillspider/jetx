import { AutoMap } from '@automapper/classes';

import { EnumField, StringField } from '../../../../decorators';
import { DeviceStatusEnum } from '../../enums/device-status.enum';

export class CreateDeviceDto {
  @StringField()
  @AutoMap()
  name!: string;

  @EnumField(() => DeviceStatusEnum)
  @AutoMap()
  status!: DeviceStatusEnum;

  @StringField()
  @AutoMap()
  stationId!: string;

  @StringField()
  @AutoMap()
  productId!: string;

  @StringField()
  @AutoMap()
  deviceNo!: string;

  @StringField({ isArray: true, each: true })
  attentions?: string[];
}

export class UpdateDeviceDto extends CreateDeviceDto {
  @StringField()
  @AutoMap()
  id!: string;
}
