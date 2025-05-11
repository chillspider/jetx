import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';

import { QUEUE } from '../../constants';
import { SharedModule } from '../../shared/shared.module';
import { NflowSharedModule } from '../nflow/nflow-shared.module';
import { PackageConsumer } from './consumers/package.consumer';
import { PackageRetryConsumer } from './consumers/package-retry.consumer';
import { PackageController } from './controllers/package.controller';
import { PackageListener } from './listeners/package.listener';
import { PackageProfile } from './profiles/package.profile';
import { PackageService } from './services/package.service';

@Module({
  imports: [
    SharedModule,
    NflowSharedModule,
    BullModule.registerQueue({
      name: QUEUE.PACKAGE.PROCESS,
      defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: true,
        delay: 1000,
        timeout: 120000,
      },
      limiter: {
        max: 1,
        duration: 1000,
      },
    }),
    BullModule.registerQueue({
      name: QUEUE.PACKAGE.RETRY,
      defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: false,
        delay: 1000,
        timeout: 120000,
        backoff: {
          type: 'exponential',
        },
      },
      limiter: {
        max: 1,
        duration: 1000,
      },
    }),
  ],
  controllers: [PackageController],
  providers: [
    PackageService,
    PackageProfile,
    PackageListener,
    PackageConsumer,
    PackageRetryConsumer,
  ],
  exports: [PackageService],
})
export class PackageModule {}
