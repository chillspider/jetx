import { Mapper } from '@automapper/core';
import { InjectMapper } from '@automapper/nestjs';
import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { DataSource } from 'typeorm';

import { getUtcNow } from '../../../common/utils';
import { QUEUE } from '../../../constants';
import { SyncActionEnum } from '../../../constants/action';
import { LoggerService } from '../../../shared/services/logger.service';
import { NflowService } from '../../nflow/services/nflow.service';
import { UserEntity } from '../../user/entities/user.entity';
import { UserType } from '../../user/enums/user-type.enum';
import { SyncRequestDto } from '../dtos/requests/sync.request.dto';
import { SyncLogDto } from '../dtos/sync-log.dto';
import { SyncUserDto } from '../dtos/sync-user.dto';
import { SyncTypeEnum } from '../enums/sync-action.enum';
import { SyncService } from '../services/sync.service';

@Processor(QUEUE.SYNC.USER)
export class SyncUserConsumer {
  constructor(
    @InjectMapper() private readonly _mapper: Mapper,
    private readonly _nflow: NflowService,
    private readonly _dataSource: DataSource,
    private readonly _syncService: SyncService,
    private readonly _logger: LoggerService,
  ) {}

  @Process({
    name: SyncTypeEnum.USER,
    concurrency: 1,
  })
  async handleSyncUser(job: Job<SyncRequestDto>): Promise<void> {
    const data = job.data;
    if (!data) return;

    const entity = await this._dataSource.getRepository(UserEntity).findOne({
      where: { id: data.id, type: UserType.CLIENT },
      withDeleted: true,
      relations: ['vehicles'],
    });
    if (!entity) return;

    return this.syncUser(data.action, entity);
  }

  private async syncUser(
    action: SyncActionEnum,
    user: UserEntity,
  ): Promise<void> {
    if (!action || !user) return;

    const syncLog: SyncLogDto = {
      objectId: user.id,
      type: SyncTypeEnum.USER,
      action: action,
      value: user,
      synced: false,
      syncedAt: getUtcNow(),
    };

    try {
      const dto = this._mapper.map(user, UserEntity, SyncUserDto);

      const nflowId = await this._nflow.getGuid(NflowService.USER, {
        id: user.id,
      });

      const guid = await this._nflow.sync({
        type: SyncTypeEnum.USER,
        action: action,
        data: dto,
        nflowId: nflowId,
      });

      if (typeof guid === 'string') {
        const nflowId = action === SyncActionEnum.Delete ? null : guid;
        this._updateNflowId(user, nflowId);
      }

      syncLog.synced = !!guid;
    } catch (error) {
      syncLog.synced = false;
    }

    this._syncService.log(syncLog);
  }

  private async _updateNflowId(
    user: UserEntity,
    nflowId?: string,
  ): Promise<void> {
    try {
      await this._dataSource.getRepository(UserEntity).update(
        {
          id: user.id,
        },
        {
          nflowId: nflowId,
        },
      );
    } catch (error) {
      this._logger.error(error);
    }
  }
}
