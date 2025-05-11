import { Injectable } from '@nestjs/common';

import { MaybeType } from '../../../common/types/maybe.type';
import { CACHE_KEY } from '../../../constants';
import { CacheService } from '../../../shared/services/cache.service';
import { CityDto } from '../dtos/city.dto';
import { CountryDto } from '../dtos/country.dto';
import { DistrictDto } from '../dtos/district.dto';
import { WardDto } from '../dtos/ward.dto';

@Injectable()
export class LocationCacheService {
  constructor(private readonly _cacheService: CacheService) {}

  public country = {
    set: (countries: CountryDto[]) => {
      this._cacheService.set(CACHE_KEY.LOCATION_COUNTRY, countries);
    },

    get: async (): Promise<MaybeType<CountryDto[]>> => {
      return await this._cacheService.get<CountryDto[]>(
        CACHE_KEY.LOCATION_COUNTRY,
      );
    },
  };

  public city = {
    set: (reqKey: string, cities: CityDto[]) => {
      this._cacheService.set(CACHE_KEY.LOCATION_CITY(reqKey), cities);
    },

    get: async (reqKey: string): Promise<MaybeType<CityDto[]>> => {
      return await this._cacheService.get<CityDto[]>(
        CACHE_KEY.LOCATION_CITY(reqKey),
      );
    },
  };

  public district = {
    set: (reqKey: string, dtos: DistrictDto[]) => {
      this._cacheService.set(CACHE_KEY.LOCATION_DISTRICT(reqKey), dtos);
    },

    get: async (reqKey: string): Promise<MaybeType<DistrictDto[]>> => {
      return await this._cacheService.get<DistrictDto[]>(
        CACHE_KEY.LOCATION_DISTRICT(reqKey),
      );
    },
  };

  public ward = {
    set: (reqKey: string, dtos: WardDto[]) => {
      this._cacheService.set(CACHE_KEY.LOCATION_WARD(reqKey), dtos);
    },

    get: async (reqKey: string): Promise<MaybeType<WardDto[]>> => {
      return await this._cacheService.get<WardDto[]>(
        CACHE_KEY.LOCATION_WARD(reqKey),
      );
    },
  };
}
