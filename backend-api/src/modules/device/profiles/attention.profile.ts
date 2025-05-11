import { createMap, Mapper, MappingProfile } from '@automapper/core';
import { AutomapperProfile, InjectMapper } from '@automapper/nestjs';
import { Injectable } from '@nestjs/common';

import { AttentionDto } from '../dtos/attention.dto';
import {
  CreateAttentionDto,
  UpdateAttentionDto,
} from '../dtos/requests/create-attention.dto';
import { AttentionEntity } from '../entities/attention.entity';

@Injectable()
export class AttentionProfile extends AutomapperProfile {
  constructor(@InjectMapper() mapper: Mapper) {
    super(mapper);
  }

  get profile(): MappingProfile {
    return (mapper) => {
      createMap(mapper, AttentionEntity, AttentionDto);
      createMap(mapper, AttentionDto, AttentionEntity);
      createMap(mapper, CreateAttentionDto, AttentionEntity);
      createMap(mapper, UpdateAttentionDto, AttentionEntity);
    };
  }
}
