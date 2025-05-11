import { Injectable } from '@nestjs/common';
import path from 'path';
import { DataSource, Repository } from 'typeorm';
import { Transactional } from 'typeorm-transactional';
import xlsx from 'xlsx';

import { CacheService } from '../../../shared/services/cache.service';
import { LoggerService } from '../../../shared/services/logger.service';
import { CityEntity } from '../../location/entities/city.entity';
import { CountryEntity } from '../../location/entities/country.entity';
import { DistrictEntity } from '../../location/entities/district.entity';
import { WardEntity } from '../../location/entities/ward.entity';

const DATA_DIR = path.join(__dirname, '../../../database/seeds');

@Injectable()
export class LocationSeedingService {
  private _cityRepository: Repository<CityEntity>;
  private _districtRepository: Repository<DistrictEntity>;
  private _wardRepository: Repository<WardEntity>;
  private _countryRepository: Repository<CountryEntity>;
  constructor(
    private _dataSource: DataSource,
    private readonly _cache: CacheService,
    private readonly _logger: LoggerService,
  ) {
    this._cityRepository = this._dataSource.getRepository(CityEntity);
    this._districtRepository = this._dataSource.getRepository(DistrictEntity);
    this._wardRepository = this._dataSource.getRepository(WardEntity);
    this._countryRepository = this._dataSource.getRepository(CountryEntity);
  }

  @Transactional()
  public async runs() {
    // Delete all data
    this._cache.deleteByPrefix('LOCATION');

    await Promise.all([
      this._countryRepository.delete({}),
      this._cityRepository.delete({}),
      this._districtRepository.delete({}),
      this._wardRepository.delete({}),
    ]);

    await this.seedCountries();
    this._logger.log('Seeding cities');
    await this.seedCities();
    this._logger.log('Seeding districts');
    await this.seedDistricts();
    this._logger.log('Seeding wards');
    await this.seedWards();
    this._logger.log('Seeding done');
  }

  private async seedCountries() {
    await this._countryRepository.save({
      code: 'VN',
      name: 'Vietnam',
    });
  }

  private async seedCities() {
    const json = await this._readExcelFile('vn-cities.xls');
    await this._cityRepository.save(json);
  }

  private async seedDistricts() {
    const json = await this._readExcelFile('vn-districts.xls');
    await this._districtRepository.save(json);
  }

  private async seedWards() {
    try {
      const json = await this._readExcelFile('vn-wards.xls');
      const wards = json.map((item: any) => {
        return {
          code: item.code || '',
          name: item.name || '',
          districtCode: item.districtCode,
          districtName: item.districtName,
          cityCode: item.cityCode,
          cityName: item.cityName,
        };
      });
      await this._wardRepository.save(wards, { chunk: 1000 });
    } catch (error) {
      console.log(error);
    }
  }

  private async _readExcelFile(filename: string) {
    const workbook = xlsx.readFile(path.join(DATA_DIR, filename));
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    return xlsx.utils.sheet_to_json(sheet);
  }
}
