import { createMap, Mapper, MappingProfile } from '@automapper/core';
import { AutomapperProfile, InjectMapper } from '@automapper/nestjs';
import { Injectable } from '@nestjs/common';

import {
  CreateVehicleDto,
  UpdateVehicleDto,
} from '../dtos/requests/create-vehicle.dto';
import { VehicleDto } from '../dtos/vehicle.dto';
import { VehicleEntity } from '../entities/vehicle.entity';

@Injectable()
export class VehicleProfile extends AutomapperProfile {
  constructor(@InjectMapper() mapper: Mapper) {
    super(mapper);
  }

  get profile(): MappingProfile {
    return (mapper) => {
      createMap(mapper, VehicleEntity, VehicleDto);
      createMap(mapper, VehicleDto, VehicleEntity);
      createMap(mapper, CreateVehicleDto, VehicleEntity);
      createMap(mapper, UpdateVehicleDto, VehicleEntity);
    };
  }
}
