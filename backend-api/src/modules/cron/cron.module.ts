import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

import { SeederModule } from '../seeder/seeder.module';
import { StartupService } from './services/startup.service';
import { TaskService } from './services/task.service';

@Module({
  imports: [ScheduleModule.forRoot(), SeederModule],
  providers: [StartupService, TaskService],
  exports: [StartupService, TaskService],
})
export class CronModule {}
