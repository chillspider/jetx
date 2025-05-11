import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { QUEUE } from '../../constants';
import { SharedModule } from '../../shared/shared.module';
import { NotificationConsumer } from './consumers/notification.consumer';
import { NotificationController } from './controller/notification.controller';
import { NotificationEntity } from './entities/notification.entity';
import { NotificationCampaignEntity } from './entities/notification-campaign.entity';
import { UserNotificationEntity } from './entities/user-notification.entity';
import { NotificationProfile } from './profiles/notification.profile';
import { CampaignService } from './services/campaign.service';
import { NotificationService } from './services/notification.service';

@Module({
  imports: [
    SharedModule,
    BullModule.registerQueue({
      name: QUEUE.NOTIFICATION,
    }),
    TypeOrmModule.forFeature([
      NotificationCampaignEntity,
      UserNotificationEntity,
      NotificationEntity,
    ]),
  ],
  controllers: [NotificationController],
  providers: [
    NotificationConsumer,
    NotificationService,
    NotificationProfile,
    CampaignService,
  ],
  exports: [
    NotificationConsumer,
    NotificationService,
    NotificationProfile,
    BullModule,
    CampaignService,
  ],
})
export class NotificationModule {}
