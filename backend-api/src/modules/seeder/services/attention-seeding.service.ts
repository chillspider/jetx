import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Transactional } from 'typeorm-transactional';

import { CacheService } from '../../../shared/services/cache.service';
import { DEFAULT_ATTENTION } from '../../device/constants/constants';
import { AttentionEntity } from '../../device/entities/attention.entity';

@Injectable()
export class AttentionSeedingService {
  private _attentionRepository: Repository<AttentionEntity>;

  constructor(
    private _dataSource: DataSource,
    private readonly _cache: CacheService,
  ) {
    this._attentionRepository = this._dataSource.getRepository(AttentionEntity);
  }

  @Transactional()
  public async runs() {
    await this._attentionRepository.save(DEFAULT_ATTENTION);
  }
}
