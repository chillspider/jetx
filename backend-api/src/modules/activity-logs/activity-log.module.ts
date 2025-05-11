import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SharedModule } from '../../shared/shared.module';
import { ActivityLogEntity } from './entities/activity-log.entity';
import { ActivityLogListener } from './listeners/activity-log.listener';
import { ActivityLogProfile } from './profiles/activity-log.profile';
import { ActivityLogService } from './services/activity-log.service';

@Module({
  imports: [SharedModule, TypeOrmModule.forFeature([ActivityLogEntity])],
  controllers: [],
  providers: [ActivityLogProfile, ActivityLogService, ActivityLogListener],
  exports: [],
})
export class ActivityLogModule {}
