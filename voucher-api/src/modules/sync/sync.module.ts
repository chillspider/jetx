import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';

import { QUEUE } from '../../constants';
import { SharedModule } from '../../shared/shared.module';
import { NflowModule } from '../nflow/nflow.module';
import { SyncCodeConsumer } from './consumers/sync-code.consumer';
import { SyncVoucherConsumer } from './consumers/sync-voucher.consumer';
import { SyncController } from './controllers/sync.controller';
import { SyncListener } from './listeners/sync.listener';
import { SyncProfile } from './profiles/sync.profile';
import { SyncService } from './services/sync.service';

@Module({
  imports: [
    SharedModule,
    NflowModule,
    BullModule.registerQueue({
      name: QUEUE.SYNC.VOUCHER,
    }),
    BullModule.registerQueue({
      name: QUEUE.SYNC.B2B_VOUCHER_CODE,
    }),
  ],
  providers: [
    SyncService,
    SyncListener,
    SyncVoucherConsumer,
    SyncCodeConsumer,
    SyncProfile,
  ],
  exports: [
    SyncService,
    SyncListener,
    SyncVoucherConsumer,
    SyncCodeConsumer,
    SyncProfile,
  ],
  controllers: [SyncController],
})
export class SyncModule {}
