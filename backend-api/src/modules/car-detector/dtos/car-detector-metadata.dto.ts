import { AutoMap } from '@automapper/classes';

import { StringFieldOptional } from '../../../decorators';

export class CarDetectorMetadataDto {
  @StringFieldOptional()
  @AutoMap()
  deviceId?: string;

  @StringFieldOptional()
  @AutoMap()
  deviceName?: string;

  @StringFieldOptional()
  @AutoMap()
  deviceNo?: string;

  @StringFieldOptional()
  @AutoMap()
  washCarBeforePic?: string;

  @StringFieldOptional()
  @AutoMap()
  washCarAfterPic?: string;
}
