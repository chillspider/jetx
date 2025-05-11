import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Queue } from 'bull';

import { EVENT, QUEUE } from '../../../constants';
import { SyncLogDto } from '../dtos/sync-log.dto';
import { SyncTypeEnum } from '../enums/sync-action.enum';
import { SyncService } from '../services/sync.service';

@Injectable()
export class SyncListener {
  constructor(
    @InjectQueue(QUEUE.SYNC.VOUCHER)
    private readonly _queue: Queue<string>,
    @InjectQueue(QUEUE.SYNC.B2B_VOUCHER_CODE)
    private readonly _queueCode: Queue<string>,
    private readonly _syncService: SyncService,
  ) {}

  @OnEvent(EVENT.SYNC.VOUCHER)
  async handleSyncVoucher(id: string): Promise<void> {
    await this._queue.add(SyncTypeEnum.VOUCHER, id);
  }

  @OnEvent(EVENT.SYNC.VOUCHER_BATCH)
  async handleSyncVoucherBatch(ids: string[]): Promise<void> {
    if (!ids?.length) return;

    const jobs = ids.map((id) => ({
      name: SyncTypeEnum.VOUCHER,
      data: id,
    }));

    await this._queue.addBulk(jobs);
  }

  @OnEvent(EVENT.SYNC.LOG)
  async handleSyncLog(data: SyncLogDto): Promise<void> {
    await this._syncService.log(data);
  }

  @OnEvent(EVENT.SYNC.B2B_VOUCHER_CODE)
  async handleSyncCode(id: string): Promise<void> {
    await this._queueCode.add(SyncTypeEnum.B2B_VOUCHER_CODE, id);
  }
}
