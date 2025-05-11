import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SharedModule } from '../../shared/shared.module';
import { AuthModule } from '../auth/auth.module';
import { ChatwootModule } from '../chatwoot/chatwoot.module';
import { NflowSharedModule } from '../nflow/nflow-shared.module';
import { NotificationModule } from '../notification/notification.module';
import { SupportController } from './controllers/support.controller';
import { SupportEntity } from './entities/support.entity';
import { SupportListener } from './listeners/support.listener';
import { SupportProfile } from './profiles/support.profile';
import { SupportService } from './services/support.service';

@Module({
  imports: [
    SharedModule,
    TypeOrmModule.forFeature([SupportEntity]),
    AuthModule,
    ChatwootModule,
    NotificationModule,
    NflowSharedModule,
  ],
  controllers: [SupportController],
  providers: [SupportService, SupportProfile, SupportListener],
  exports: [SupportService],
})
export class SupportModule {}
