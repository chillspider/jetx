import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';

import { QUEUE } from '../../constants';
import { SharedModule } from '../../shared/shared.module';
import { NflowSharedModule } from '../nflow/nflow-shared.module';
import { SyncCampaignConsumer } from './consumers/sync-campaign.consumer';
import { SyncOrderConsumer } from './consumers/sync-order.consumer';
import { SyncUserConsumer } from './consumers/sync-user.consumer';
import { SyncController } from './controllers/sync.controller';
import { SyncListener } from './listeners/sync.listener';
import { SyncProfile } from './profiles/sync.profile';
import { SyncService } from './services/sync.service';

@Module({
  imports: [
    SharedModule,
    NflowSharedModule,
    BullModule.registerQueue({
      name: QUEUE.SYNC.USER,
      defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: true,
        delay: 1000,
      },
      limiter: {
        max: 1,
        duration: 1000,
      },
    }),
    BullModule.registerQueue({
      name: QUEUE.SYNC.ORDER,
      defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: true,
        delay: 1000,
      },
      limiter: {
        max: 1,
        duration: 1000,
      },
    }),
    BullModule.registerQueue({
      name: QUEUE.SYNC.CAMPAIGN,
      defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: true,
        delay: 1000,
      },
      limiter: {
        max: 1,
        duration: 1000,
      },
    }),
  ],
  providers: [
    SyncService,
    SyncListener,
    SyncUserConsumer,
    SyncOrderConsumer,
    SyncCampaignConsumer,
    SyncProfile,
  ],
  exports: [SyncService],
  controllers: [SyncController],
})
export class SyncModule {}
