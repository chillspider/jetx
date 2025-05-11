import { createMap, Mapper, MappingProfile } from '@automapper/core';
import { AutomapperProfile, InjectMapper } from '@automapper/nestjs';
import { Injectable } from '@nestjs/common';

import {
  CreateStationDto,
  UpdateStationDto,
} from '../dtos/requests/create-station.dto';
import { CreateStationLocationDto } from '../dtos/requests/create-station-location.dto';
import { StationDto } from '../dtos/station.dto';
import { StationLocationDto } from '../dtos/station-location.dto';
import { CreateStationModeDto, StationModeDto } from '../dtos/station-mode.dto';
import { StationEntity } from '../entities/station.entity';
import { StationLocationEntity } from '../entities/station-location.entity';
import { StationModeEntity } from '../entities/station-mode.entity';

@Injectable()
export class StationProfile extends AutomapperProfile {
  constructor(@InjectMapper() mapper: Mapper) {
    super(mapper);
  }

  get profile(): MappingProfile {
    return (mapper) => {
      createMap(mapper, StationEntity, StationDto);
      createMap(mapper, StationLocationEntity, StationLocationDto);
      createMap(mapper, StationDto, StationEntity);
      createMap(mapper, StationLocationDto, StationLocationEntity);
      createMap(mapper, CreateStationDto, StationEntity);
      createMap(mapper, CreateStationLocationDto, StationLocationEntity);
      createMap(mapper, UpdateStationDto, StationEntity);
      createMap(mapper, StationModeDto, StationModeEntity);
      createMap(mapper, StationModeEntity, StationModeDto);
      createMap(mapper, CreateStationModeDto, StationModeEntity);
    };
  }
}
