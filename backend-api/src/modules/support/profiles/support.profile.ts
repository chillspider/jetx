import { createMap, Mapper, MappingProfile } from '@automapper/core';
import { AutomapperProfile, InjectMapper } from '@automapper/nestjs';
import { Injectable } from '@nestjs/common';

import { CreateSupportRequestDto } from '../dtos/requests/create-support.request.dto';
import { SupportDto } from '../dtos/support.dto';
import { SupportEntity } from '../entities/support.entity';

@Injectable()
export class SupportProfile extends AutomapperProfile {
  constructor(@InjectMapper() mapper: Mapper) {
    super(mapper);
  }

  get profile(): MappingProfile {
    return (mapper) => {
      createMap(mapper, SupportEntity, SupportDto);
      createMap(mapper, SupportDto, SupportEntity);
      createMap(mapper, CreateSupportRequestDto, SupportEntity);
    };
  }
}
