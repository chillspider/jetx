import { AutoMap } from '@automapper/classes';

import { AbstractDto } from '../../../common/dto/abstract.dto';
import {
  ClassField,
  ClassFieldOptional,
  EnumField,
  NumberFieldOptional,
  StringField,
  StringFieldOptional,
} from '../../../decorators';
import { DeviceDto } from '../../device/dtos/device.dto';
import { StationStatus } from '../enums/station-status.enum';
import { StationLocationDto } from './station-location.dto';
import { StationMetadataDto } from './station-metadata.dto';
import { StationTagDto } from './station-tag.dto';

export class StationDto extends AbstractDto {
  @StringField()
  @AutoMap()
  name!: string;

  @StringFieldOptional()
  @AutoMap()
  description?: string;

  @EnumField(() => StationStatus)
  @AutoMap()
  status?: StationStatus;

  @StringFieldOptional()
  @AutoMap()
  featureImageUrl?: string;

  @StringFieldOptional({ isArray: true })
  @AutoMap(() => [String])
  images?: string[];

  @ClassField(() => StationTagDto, { isArray: true })
  @AutoMap(() => [StationTagDto])
  tags?: StationTagDto[];

  @ClassField(() => StationLocationDto)
  @AutoMap(() => StationLocationDto)
  location!: StationLocationDto;

  @NumberFieldOptional()
  @AutoMap()
  distance?: number;

  @ClassFieldOptional(() => StationMetadataDto)
  @AutoMap(() => StationMetadataDto)
  data?: StationMetadataDto;

  // ! Additional fields
  @AutoMap(() => [DeviceDto])
  devices?: DeviceDto[];
  deviceCount?: number;
  deviceReadyCount?: number;
}
