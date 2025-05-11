import { AutoMap } from '@automapper/classes';

import {
  ClassField,
  ClassFieldOptional,
  EnumField,
  StringField,
  StringFieldOptional,
} from '../../../../decorators';
import { StationStatus } from '../../enums/station-status.enum';
import { StationMetadataDto } from '../station-metadata.dto';
import { StationTagDto } from '../station-tag.dto';
import { CreateStationLocationDto } from './create-station-location.dto';

export class CreateStationDto {
  @StringField()
  @AutoMap()
  name!: string;

  @StringFieldOptional()
  @AutoMap()
  description?: string;

  @EnumField(() => StationStatus)
  @AutoMap()
  status?: StationStatus;

  @ClassField(() => StationTagDto, { isArray: true })
  @AutoMap(() => [StationTagDto])
  tags?: StationTagDto[];

  @ClassField(() => CreateStationLocationDto)
  @AutoMap(() => CreateStationLocationDto)
  location!: CreateStationLocationDto;

  @StringFieldOptional()
  @AutoMap()
  featureImageUrl?: string;

  @StringFieldOptional({ isArray: true, each: true, nullable: true })
  @AutoMap(() => [String])
  images?: string[];

  @ClassFieldOptional(() => StationMetadataDto)
  @AutoMap(() => StationMetadataDto)
  data?: StationMetadataDto;
}

export class UpdateStationDto extends CreateStationDto {
  @StringField()
  @AutoMap()
  id!: string;
}
