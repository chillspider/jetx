import { createMap, Mapper, MappingProfile } from '@automapper/core';
import { AutomapperProfile, InjectMapper } from '@automapper/nestjs';

import { SettingDto } from '../dtos/setting.dto';
import { SettingEntity } from '../entities/setting.entity';

export class SettingProfile extends AutomapperProfile {
  constructor(@InjectMapper() mapper: Mapper) {
    super(mapper);
  }

  get profile(): MappingProfile {
    return (mapper) => {
      createMap(mapper, SettingEntity, SettingDto);
      createMap(mapper, SettingDto, SettingEntity);
    };
  }
}
