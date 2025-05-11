import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

import { SeederModule } from '../seeder/seeder.module';
import { StartupService } from './services/startup.service';

@Module({
  imports: [ScheduleModule.forRoot(), SeederModule],
  providers: [StartupService],
  exports: [],
})
export class CronModule {}
