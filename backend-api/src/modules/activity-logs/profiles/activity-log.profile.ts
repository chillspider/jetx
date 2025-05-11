import {
  createMap,
  forMember,
  mapFrom,
  Mapper,
  MappingProfile,
} from '@automapper/core';
import { AutomapperProfile, InjectMapper } from '@automapper/nestjs';
import { Injectable } from '@nestjs/common';

import { ActivityLogDto } from '../dtos/activity-log.dto';
import { ActivityLogEntity } from '../entities/activity-log.entity';

@Injectable()
export class ActivityLogProfile extends AutomapperProfile {
  constructor(@InjectMapper() mapper: Mapper) {
    super(mapper);
  }

  get profile(): MappingProfile {
    return (mapper) => {
      createMap(
        mapper,
        ActivityLogEntity,
        ActivityLogDto,
        forMember(
          (d) => d.value,
          mapFrom((s) => s.value ?? {}),
        ),
      );
      createMap(
        mapper,
        ActivityLogDto,
        ActivityLogEntity,
        forMember(
          (d) => d.value,
          mapFrom((s) => s.value ?? {}),
        ),
      );
    };
  }
}
