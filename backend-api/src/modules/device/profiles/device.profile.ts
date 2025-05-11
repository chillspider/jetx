import {
  createMap,
  forMember,
  mapFrom,
  Mapper,
  MappingProfile,
} from '@automapper/core';
import { AutomapperProfile, InjectMapper } from '@automapper/nestjs';
import { Injectable } from '@nestjs/common';

import { DeviceAndModeDto, DeviceDto } from '../dtos/device.dto';
import { DeviceLogDto } from '../dtos/device-log.dto';
import {
  CreateDeviceDto,
  UpdateDeviceDto,
} from '../dtos/requests/create-device.dto';
import { DeviceEntity } from '../entities/device.entity';
import { DeviceLogEntity } from '../entities/device-log.entity';

@Injectable()
export class DeviceProfile extends AutomapperProfile {
  constructor(@InjectMapper() mapper: Mapper) {
    super(mapper);
  }

  get profile(): MappingProfile {
    return (mapper) => {
      createMap(mapper, DeviceEntity, DeviceDto);
      createMap(mapper, DeviceEntity, DeviceAndModeDto);
      createMap(mapper, DeviceDto, DeviceEntity);
      createMap(mapper, CreateDeviceDto, DeviceEntity);
      createMap(mapper, UpdateDeviceDto, DeviceEntity);
      createMap(
        mapper,
        DeviceLogDto,
        DeviceLogEntity,
        forMember(
          (d) => d.data,
          mapFrom((s) => s.data),
        ),
        forMember(
          (d) => d.body,
          mapFrom((s) => s.body),
        ),
      );
      createMap(
        mapper,
        DeviceLogEntity,
        DeviceLogDto,
        forMember(
          (d) => d.data,
          mapFrom((s) => s.data),
        ),
        forMember(
          (d) => d.body,
          mapFrom((s) => s.body),
        ),
      );
    };
  }
}
