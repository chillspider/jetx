import {
  redisDelByPattern,
  RedisDeletionMethod,
} from '@eturino/ioredis-del-by-pattern';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { Cache, Store } from 'cache-manager';

import { MaybeType } from '../../common/types/maybe.type';
import { ApiConfigService } from './api-config.service';

export const CACHE_KEY_DELIMITER = ':';

export interface IRedisCache extends Cache {
  store: IRedisStore;
}

interface IRedisStore extends Store {
  name: 'redis';
  getClient: () => any;
  isCacheableValue: (value: any) => boolean;
}

@Injectable()
export class CacheService {
  private _client: any;
  private _prefix: string;
  constructor(
    private configService: ApiConfigService,
    @Inject(CACHE_MANAGER) private cache: IRedisCache,
    @Inject(CACHE_MANAGER) private _cacheManager: Cache,
  ) {
    this._client = cache.store.getClient();
    this._prefix = this.configService.moduleType;
  }

  async get<T>(key: string): Promise<MaybeType<T>> {
    return this._cacheManager.get<T>(`${this._prefix}:${key}`);
  }

  async set(key: string, value: any, ttl = 0): Promise<void> {
    return this._cacheManager.set(`${this._prefix}:${key}`, value, { ttl });
  }

  async delete(key: string): Promise<boolean> {
    await this._cacheManager.del(`${this._prefix}:${key}`);
    return true;
  }

  // return number of deleted items
  // async multiDelete(keys: string[]): Promise<number> {
  //     return await this._cacheManager.del.apply(redis, keys);
  // }

  // return number of deleted items
  async deleteByPrefix(prefix: string, ...appends: string[]): Promise<number> {
    const combine = [this._prefix, prefix, ...appends, '*'];
    const pattern = combine.join(CACHE_KEY_DELIMITER);

    return await redisDelByPattern({
      pattern: pattern,
      redis: this._client,
      deletionMethod: RedisDeletionMethod.unlink,
      withPipeline: true,
    });
  }
}
