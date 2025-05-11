import { createMap, Mapper, MappingProfile } from '@automapper/core';
import { AutomapperProfile, InjectMapper } from '@automapper/nestjs';
import { Injectable } from '@nestjs/common';

import { CityDto } from '../dtos/city.dto';
import { CountryDto } from '../dtos/country.dto';
import { DistrictDto } from '../dtos/district.dto';
import { WardDto } from '../dtos/ward.dto';
import { CityEntity } from '../entities/city.entity';
import { CountryEntity } from '../entities/country.entity';
import { DistrictEntity } from '../entities/district.entity';
import { WardEntity } from '../entities/ward.entity';

@Injectable()
export class LocationProfile extends AutomapperProfile {
  constructor(@InjectMapper() mapper: Mapper) {
    super(mapper);
  }

  get profile(): MappingProfile {
    return (mapper: Mapper) => {
      createMap(mapper, CityEntity, CityDto);
      createMap(mapper, DistrictEntity, DistrictDto);
      createMap(mapper, WardEntity, WardDto);
      createMap(mapper, CountryEntity, CountryDto);
    };
  }
}
