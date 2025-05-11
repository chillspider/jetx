import { BullModule } from '@nestjs/bull';
import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { QUEUE } from '../../constants';
import { SharedModule } from '../../shared/shared.module';
import { DeviceModule } from '../device/device.module';
import { StationCacheService } from './cache/station-cache.service';
import { StationConsumer } from './consumers/station.consumer';
import { StationController } from './controllers/station.controller';
import { StationModeController } from './controllers/station-mode.controller';
import { StationEntity } from './entities/station.entity';
import { StationLocationEntity } from './entities/station-location.entity';
import { StationModeEntity } from './entities/station-mode.entity';
import { StationListener } from './listeners/station.listener';
import { StationProfile } from './profiles/station.profile';
import { StationService } from './services/station.service';
import { StationModeService } from './services/station-mode.service';

@Module({
  imports: [
    SharedModule,
    forwardRef(() => DeviceModule),
    TypeOrmModule.forFeature([
      StationEntity,
      StationLocationEntity,
      StationModeEntity,
    ]),
    BullModule.registerQueue({
      name: QUEUE.STATION,
    }),
  ],
  controllers: [StationController, StationModeController],
  providers: [
    StationService,
    StationProfile,
    StationCacheService,
    StationListener,
    StationConsumer,
    StationModeService,
  ],
  exports: [
    StationService,
    StationProfile,
    StationCacheService,
    StationListener,
    StationConsumer,
    StationModeService,
  ],
})
export class StationModule {}
