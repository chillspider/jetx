import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SharedModule } from '../../shared/shared.module';
import { NflowSharedModule } from '../nflow/nflow-shared.module';
import { SettingController } from './controllers/setting.controller';
import { SettingEntity } from './entities/setting.entity';
import { SettingProfile } from './profiles/setting.profile';
import { SettingService } from './services/setting.service';

@Module({
  imports: [
    SharedModule,
    TypeOrmModule.forFeature([SettingEntity]),
    NflowSharedModule,
  ],
  controllers: [SettingController],
  providers: [SettingService, SettingProfile],
  exports: [],
})
export class SettingModule {}
