import { createMap, Mapper, MappingProfile } from '@automapper/core';
import { AutomapperProfile, InjectMapper } from '@automapper/nestjs';
import { Injectable } from '@nestjs/common';

import { TranslationDto } from '../../common/dto/translation.dto';
import { Translation } from '../../common/entities/translation.entity';

@Injectable()
export class TranslationProfile extends AutomapperProfile {
  constructor(@InjectMapper() mapper: Mapper) {
    super(mapper);
  }

  get profile(): MappingProfile {
    return (mapper) => {
      createMap(mapper, Translation, TranslationDto);
      createMap(mapper, TranslationDto, Translation);
    };
  }
}
