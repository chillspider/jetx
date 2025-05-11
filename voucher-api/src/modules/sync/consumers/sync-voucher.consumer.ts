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
import { VoucherEntity } from '../../voucher/entities/voucher.entity';
import { SyncLogDto } from '../dtos/sync-log.dto';
import { SyncVoucherDto } from '../dtos/sync-voucher.dto';
import { SyncTypeEnum } from '../enums/sync-action.enum';
import { SyncService } from '../services/sync.service';

@Processor(QUEUE.SYNC.VOUCHER)
export class SyncVoucherConsumer {
  constructor(
    @InjectMapper() private readonly _mapper: Mapper,
    private readonly _nflow: NflowService,
    private readonly _dataSource: DataSource,
    private readonly _logger: LoggerService,
    private readonly _syncService: SyncService,
  ) {}

  @Process({
    name: SyncTypeEnum.VOUCHER,
    concurrency: 1,
  })
  async handleSyncVoucher(job: Job<string>): Promise<void> {
    const id = job.data;
    if (!id) return;

    const entity = await this.getVoucher(id);
    if (!entity) return;

    return this.syncNflowVoucher(entity);
  }

  private async syncNflowVoucher(voucher: VoucherEntity): Promise<void> {
    if (!voucher) return;

    const syncLog = this.createSyncLog(voucher);

    try {
      const dto = this._mapper.map(voucher, VoucherEntity, SyncVoucherDto);

      // await this._getVoucherMetadata(dto);

      const nflowId = await this._nflow.getGuid(NflowService.VOUCHER, {
        id: voucher.id,
      });

      const guid = await this._nflow.sync({
        type: SyncTypeEnum.VOUCHER,
        action: SyncActionEnum.Sync,
        data: dto,
        nflowId: nflowId,
      });

      if (typeof guid === 'string') {
        this._updateNflowId(voucher, guid);
      }

      syncLog.synced = !!guid;
    } catch (error) {
      syncLog.synced = false;
    }

    this._syncService.log(syncLog);
  }

  private async _updateNflowId(
    voucher: VoucherEntity,
    nflowId?: string,
  ): Promise<void> {
    try {
      await this._dataSource
        .getRepository(VoucherEntity)
        .update({ id: voucher.id }, { nflowId });
    } catch (error) {
      this._logger.error(error);
    }
  }

  private async getVoucher(id: string): Promise<VoucherEntity> {
    return this._dataSource.getRepository(VoucherEntity).findOneBy({ id });
  }

  private createSyncLog(entity: VoucherEntity): SyncLogDto {
    return {
      objectId: entity.id,
      type: SyncTypeEnum.VOUCHER,
      action: SyncActionEnum.Sync,
      value: entity,
      synced: false,
      syncedAt: getUtcNow(),
    };
  }
}
