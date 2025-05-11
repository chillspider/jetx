import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Queue } from 'bull';

import { EVENT, QUEUE } from '../../../constants';
import { SyncRequestDto } from '../dtos/requests/sync.request.dto';
import { SyncLogDto } from '../dtos/sync-log.dto';
import { SyncTypeEnum } from '../enums/sync-action.enum';
import { SyncService } from '../services/sync.service';

@Injectable()
export class SyncListener {
  constructor(
    @InjectQueue(QUEUE.SYNC.USER)
    private readonly _queue: Queue<SyncRequestDto>,
    @InjectQueue(QUEUE.SYNC.ORDER)
    private readonly _orderQueue: Queue<SyncRequestDto>,
    @InjectQueue(QUEUE.SYNC.CAMPAIGN)
    private readonly _campaignQueue: Queue<SyncRequestDto>,
    private readonly _syncService: SyncService,
  ) {}

  @OnEvent(EVENT.SYNC.USER)
  async handleSyncUser(data: SyncRequestDto): Promise<void> {
    await this._queue.add(SyncTypeEnum.USER, data);
  }

  @OnEvent(EVENT.SYNC.ORDER)
  async handleOrderSync(data: SyncRequestDto): Promise<void> {
    await this._orderQueue.add(SyncTypeEnum.ORDER, data);
  }

  @OnEvent(EVENT.SYNC.LOG)
  async handleSyncLog(data: SyncLogDto): Promise<void> {
    await this._syncService.log(data);
  }

  @OnEvent(EVENT.SYNC.CAMPAIGN)
  async handleSyncCampaign(data: SyncRequestDto): Promise<void> {
    await this._campaignQueue.add(SyncTypeEnum.CAMPAIGN, data);
  }
}
