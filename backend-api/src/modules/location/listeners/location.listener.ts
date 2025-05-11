import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import { EVENT } from '../../../constants';
import { LocationCacheService } from '../cache/location-cache.service';
import { CityDto } from '../dtos/city.dto';
import { CountryDto } from '../dtos/country.dto';
import { DistrictDto } from '../dtos/district.dto';
import { WardDto } from '../dtos/ward.dto';

@Injectable()
export class LocationListener {
  constructor(private readonly _cacheService: LocationCacheService) {}

  @OnEvent(EVENT.LOCATION.SET_COUNTRY)
  async setAllCountriesCache(countries: CountryDto[]): Promise<void> {
    this._cacheService.country.set(countries);
  }

  @OnEvent(EVENT.LOCATION.SET_CITY)
  async setAllCitiesCache(key: string, cities: CityDto[]): Promise<void> {
    this._cacheService.city.set(key, cities);
  }

  @OnEvent(EVENT.LOCATION.SET_DISTRICT)
  async setDistrictsCache(
    key: string,
    districts: DistrictDto[],
  ): Promise<void> {
    this._cacheService.district.set(key, districts);
  }

  @OnEvent(EVENT.LOCATION.SET_WARD)
  async setWardsCache(key: string, wards: WardDto[]): Promise<void> {
    this._cacheService.ward.set(key, wards);
  }
}
