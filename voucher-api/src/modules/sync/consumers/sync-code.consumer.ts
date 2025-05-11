import { Mapper } from '@automapper/core';
import { InjectMapper } from '@automapper/nestjs';
import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { DataSource } from 'typeorm';

import { getUtcNow } from '../../../common/utils';
import { QUEUE } from '../../../constants';
import { SyncActionEnum } from '../../../constants/action';
import { LoggerService } from '../../../shared/services/logger.service';
import { B2bVoucherCodeEntity } from '../../b2b-voucher/entities/b2b-voucher-code.entity';
import { NflowService } from '../../nflow/services/nflow.service';
import { SyncLogDto } from '../dtos/sync-log.dto';
import { SyncB2BVoucherCodeDto } from '../dtos/sync-voucher-code.dto';
import { SyncTypeEnum } from '../enums/sync-action.enum';
import { SyncService } from '../services/sync.service';

@Processor(QUEUE.SYNC.B2B_VOUCHER_CODE)
export class SyncCodeConsumer {
  constructor(
    @InjectMapper() private readonly _mapper: Mapper,
    private readonly _nflow: NflowService,
    private readonly _dataSource: DataSource,
    private readonly _logger: LoggerService,
    private readonly _syncService: SyncService,
  ) {}

  @Process({
    name: SyncTypeEnum.B2B_VOUCHER_CODE,
    concurrency: 1,
  })
  async handleSyncCode(job: Job<string>): Promise<void> {
    const id = job.data;
    if (!id) return;

    const entity = await this.getVoucherCode(id);
    if (!entity) return;

    return this.syncNflowCode(entity);
  }

  private async syncNflowCode(code: B2bVoucherCodeEntity): Promise<void> {
    if (!code) return;
    const syncLog = this.createSyncLog(code);

    try {
      const nflowId = await this._nflow.getGuid(NflowService.VOUCHER_CODE, {
        id: code.id,
      });
      if (!nflowId) return;

      const dto = this._mapper.map(
        code,
        B2bVoucherCodeEntity,
        SyncB2BVoucherCodeDto,
      );

      const guid = await this._nflow.sync({
        type: SyncTypeEnum.B2B_VOUCHER_CODE,
        action: SyncActionEnum.Sync,
        data: dto,
        nflowId: nflowId,
      });

      syncLog.synced = !!guid;
    } catch (error) {
      syncLog.synced = false;
    }

    this._syncService.log(syncLog);
  }

  private async getVoucherCode(id: string): Promise<B2bVoucherCodeEntity> {
    return this._dataSource
      .getRepository(B2bVoucherCodeEntity)
      .findOneBy({ id });
  }

  private createSyncLog(entity: B2bVoucherCodeEntity): SyncLogDto {
    return {
      objectId: entity.id,
      type: SyncTypeEnum.B2B_VOUCHER_CODE,
      action: SyncActionEnum.Sync,
      value: entity,
      synced: false,
      syncedAt: getUtcNow(),
    };
  }
}
