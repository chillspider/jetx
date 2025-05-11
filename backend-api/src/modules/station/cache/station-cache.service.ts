import { Injectable } from '@nestjs/common';

import { CACHE_KEY } from '../../../constants';
import { CacheService } from '../../../shared/services/cache.service';
import { StationDto } from '../dtos/station.dto';

@Injectable()
export class StationCacheService {
  constructor(private readonly _cacheService: CacheService) {}

  async set(stations: StationDto[]) {
    return this._cacheService.set(CACHE_KEY.STATIONS, stations);
  }

  async get(): Promise<StationDto[]> {
    const result = await this._cacheService.get<StationDto[]>(
      CACHE_KEY.STATIONS,
    );
    return result || [];
  }
}
