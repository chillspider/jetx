import { Mapper } from '@automapper/core';
import { InjectMapper } from '@automapper/nestjs';
import { BadRequestException, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DataSource, Repository } from 'typeorm';

import { EVENT } from '../../../constants';
import { W24Error } from '../../../constants/error-code';
import { LocationCacheService } from '../cache/location-cache.service';
import { CountryCode } from '../constants/constants';
import { CityDto } from '../dtos/city.dto';
import { CountryDto } from '../dtos/country.dto';
import { DistrictDto } from '../dtos/district.dto';
import { WardDto } from '../dtos/ward.dto';
import { CityEntity } from '../entities/city.entity';
import { CountryEntity } from '../entities/country.entity';
import { DistrictEntity } from '../entities/district.entity';
import { WardEntity } from '../entities/ward.entity';

@Injectable()
export class LocationService {
  private readonly repositories: {
    [key: string]: {
      district: Repository<any>;
      ward: Repository<any>;
      city: Repository<any>;
    };
  };
  private _countryRepository: Repository<CountryEntity>;

  constructor(
    @InjectMapper() private readonly _mapper: Mapper,
    private readonly _dataSource: DataSource,
    private readonly _emitter: EventEmitter2,
    private readonly _cache: LocationCacheService,
  ) {
    this._countryRepository = this._dataSource.getRepository(CountryEntity);
    this.repositories = this._initializeRepositories();
  }

  private _initializeRepositories() {
    return {
      [CountryCode.VN]: {
        district: this._dataSource.getRepository(DistrictEntity),
        ward: this._dataSource.getRepository(WardEntity),
        city: this._dataSource.getRepository(CityEntity),
      },
      // Add other countries here
      // US: {
      //   district: this._dataSource.getRepository(USDistrictEntity),
      //   ward: this._dataSource.getRepository(USWardEntity),
      //   city: this._dataSource.getRepository(USCityEntity),
      // },
    };
  }

  public async getCountries(): Promise<CountryDto[]> {
    const cache = await this._cache.country.get();
    if (cache?.length) {
      return cache;
    }

    const entities = await this._countryRepository.find();
    const countries = this._mapper.mapArray(
      entities,
      CountryEntity,
      CountryDto,
    );

    if (countries?.length) {
      this._emitter.emit(EVENT.LOCATION.SET_COUNTRY, countries);
    }

    return countries;
  }

  public async getCities(
    countryCode: string = CountryCode.VN,
  ): Promise<CityDto[]> {
    const key = countryCode.toUpperCase();

    const cache = await this._cache.city.get(key);
    if (cache?.length) {
      return cache;
    }

    const repository = this.getRepositoryForCountry(countryCode, 'city');

    const entities = await repository.find();
    const cities = this._mapper.mapArray(entities, CityEntity, CityDto);

    if (cities?.length) {
      this._emitter.emit(EVENT.LOCATION.SET_CITY, key, cities);
    }

    return cities;
  }

  public async getDistricts(
    cityCode: string,
    countryCode: string = CountryCode.VN,
  ): Promise<DistrictDto[]> {
    const cacheKey = `${countryCode}:${cityCode}`.toUpperCase();
    const cache = await this._cache.district.get(cacheKey);
    if (cache?.length) {
      return cache;
    }

    const repository = this.getRepositoryForCountry(countryCode, 'district');

    const entities = await repository.findBy({ cityCode });
    const districts = this._mapper.mapArray(
      entities,
      repository.target as any,
      DistrictDto,
    );

    if (districts?.length) {
      this._emitter.emit(EVENT.LOCATION.SET_DISTRICT, cacheKey, districts);
    }

    return districts;
  }

  public async getWards(
    districtCode: string,
    countryCode: string = CountryCode.VN,
  ): Promise<WardDto[]> {
    const cacheKey = `${countryCode}:${districtCode}`.toUpperCase();
    const cache = await this._cache.ward.get(cacheKey);
    if (cache?.length) {
      return cache;
    }

    const repository = this.getRepositoryForCountry(countryCode, 'ward');

    const entities = await repository.findBy({ districtCode });
    const wards = this._mapper.mapArray(
      entities,
      repository.target as any,
      WardDto,
    );

    if (wards?.length) {
      this._emitter.emit(EVENT.LOCATION.SET_WARD, cacheKey, wards);
    }

    return wards;
  }

  private getRepositoryForCountry(
    countryCode: string,
    type: 'district' | 'ward' | 'city',
  ): Repository<any> {
    const code = countryCode.toUpperCase();

    const countryRepositories = this.repositories[code];
    if (!countryRepositories) {
      throw new BadRequestException(W24Error.UnprocessableContent);
    }
    return countryRepositories[type];
  }
}
