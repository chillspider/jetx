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
import { NflowCampaignDto } from '../../notification/dtos/nflow-campaign.dto';
import { NotificationCampaignEntity } from '../../notification/entities/notification-campaign.entity';
import { SyncRequestDto } from '../dtos/requests/sync.request.dto';
import { SyncLogDto } from '../dtos/sync-log.dto';
import { SyncTypeEnum } from '../enums/sync-action.enum';
import { SyncService } from '../services/sync.service';

@Processor(QUEUE.SYNC.CAMPAIGN)
export class SyncCampaignConsumer {
  constructor(
    @InjectMapper() private readonly _mapper: Mapper,
    private readonly _nflow: NflowService,
    private readonly _dataSource: DataSource,
    private readonly _syncService: SyncService,
    private readonly _logger: LoggerService,
  ) {}

  @Process({
    name: SyncTypeEnum.CAMPAIGN,
    concurrency: 1,
  })
  async handleSyncCampaign(job: Job<SyncRequestDto>): Promise<void> {
    const data = job.data;
    if (!data) return;

    const entity = await this._dataSource
      .getRepository(NotificationCampaignEntity)
      .findOneBy({ id: data.id });
    if (!entity) return;

    return this.syncCampaign(data.action, entity);
  }

  private async syncCampaign(
    action: SyncActionEnum,
    campaign: NotificationCampaignEntity,
  ): Promise<void> {
    if (!action || !campaign) return;

    const syncLog: SyncLogDto = {
      objectId: campaign.id,
      type: SyncTypeEnum.CAMPAIGN,
      action: action,
      value: campaign,
      synced: false,
      syncedAt: getUtcNow(),
    };

    try {
      const dto = this._mapper.map(
        campaign,
        NotificationCampaignEntity,
        NflowCampaignDto,
      );

      const nflowId = await this._nflow.getGuid(NflowService.CAMPAIGN, {
        id: campaign.id,
      });

      const guid = await this._nflow.sync({
        type: SyncTypeEnum.CAMPAIGN,
        action: action,
        data: dto,
        nflowId: nflowId,
      });

      if (typeof guid === 'string') {
        const nflowId = action === SyncActionEnum.Delete ? null : guid;
        this._updateNflowId(campaign, nflowId);
      }

      syncLog.synced = !!guid;
    } catch (error) {
      syncLog.synced = false;
    }

    this._syncService.log(syncLog);
  }

  private async _updateNflowId(
    campaign: NotificationCampaignEntity,
    nflowId?: string,
  ): Promise<void> {
    try {
      await this._dataSource
        .getRepository(NotificationCampaignEntity)
        .update(campaign.id, {
          nflowId: nflowId,
        });
    } catch (error) {
      this._logger.error(error);
    }
  }
}
