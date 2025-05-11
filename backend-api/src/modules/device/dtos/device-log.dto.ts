import { AutoMap } from '@automapper/classes';

import { DeviceLogEnum } from '../enums/device-log.enum';

export class DeviceLogDto {
  @AutoMap()
  type: DeviceLogEnum;

  @AutoMap()
  deviceNo: string;

  @AutoMap()
  orderId?: string;

  @AutoMap()
  data: Record<string, any> | any;

  @AutoMap()
  body: Record<string, any> | any;
}
