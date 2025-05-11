import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { DataSource } from 'typeorm';

import { defaultLanguageCode, QUEUE } from '../../../constants';
import {
  BatchResponse,
  FCMService,
} from '../../../shared/services/fcm.service';
import { TranslationService } from '../../../shared/services/translation.service';
import { UserEntity } from '../../user/entities/user.entity';
import { NotificationDto } from '../dtos/notification.dto';
import {
  NotificationMulticastPayload,
  NotificationPayload,
} from '../dtos/notification-payload.dto';
import { NotificationEntity } from '../entities/notification.entity';
import { UserNotificationEntity } from '../entities/user-notification.entity';
import {
  NotificationProcess,
  NotificationTarget,
} from '../enums/notification.enum';
import { NotificationChannel } from '../enums/notification-channel.enum';
import { CampaignService } from '../services/campaign.service';

@Processor(QUEUE.NOTIFICATION)
export class NotificationConsumer {
  constructor(
    private readonly _fcmService: FCMService,
    private readonly _dataSource: DataSource,
    private readonly _translate: TranslationService,
    private readonly _campaignService: CampaignService,
  ) {}

  @Process(NotificationProcess.ALL)
  async sendAll(job: Job<NotificationDto>): Promise<void> {
    const notification = job.data;
    if (!notification) return;

    const { lang = defaultLanguageCode, title, content } = notification;

    const [msgTitle, msgContent] = this._translate.translates([
      { key: title, options: { args: notification.data, lang } },
      { key: content, options: { args: notification.data, lang } },
    ]);

    const payload: NotificationPayload = {
      notification: { title: msgTitle, body: msgContent },
      type: notification.type,
      data: notification.data,
      deepLink: notification.deepLink,
    };

    await this._fcmService.sendAll(payload);
  }

  @Process(NotificationProcess.CUSTOMER)
  async sendToCustomer(job: Job<NotificationDto>): Promise<void> {
    const notification = job.data;
    if (!notification || !notification?.userId) return;

    const { userId, lang = defaultLanguageCode, title, content } = notification;

    const user = await this._dataSource.getRepository(UserEntity).findOneBy({
      id: userId,
    });
    if (!user) return;

    const tokens = user.deviceTokens;
    if (!tokens?.length) return;

    const [msgTitle, msgContent] = this._translate.translates([
      { key: title, options: { args: notification.data, lang } },
      { key: content, options: { args: notification.data, lang } },
    ]);

    const payload: NotificationMulticastPayload = {
      notification: { title: msgTitle, body: msgContent },
      type: notification.type,
      data: notification.data,
      tokens: tokens,
      deepLink: notification.deepLink,
    };

    await this._saveNotification(notification);
    const result = await this._fcmService.sendMulticast(payload);

    if (result.failureCount) {
      this._handleFailedTokens(userId, tokens, result);
    }
  }

  async _saveNotification(notification: NotificationDto) {
    const entity: Partial<NotificationEntity> = {
      title: notification.title,
      content: notification.content,
      type: notification.type,
      data: notification.data,
      target: NotificationTarget.SPECIFIC,
      channel: NotificationChannel.APP_PUSH,
      deepLink: notification.deepLink,
    };

    await this._dataSource.transaction(async (manager) => {
      const result = await manager
        .getRepository(NotificationEntity)
        .save(entity);

      const userNotification: Partial<UserNotificationEntity> = {
        userId: notification.userId,
        notificationId: result.id,
        isRead: false,
      };
      await manager
        .getRepository(UserNotificationEntity)
        .save(userNotification);
    });
  }

  async _handleFailedTokens(
    userId: string,
    tokens: string[],
    result: BatchResponse,
  ) {
    const responses = result?.responses || [];
    if (!responses.length) return;

    const failedTokens = responses
      .map((res, index) => (res.success ? null : tokens[index]))
      .filter(Boolean);

    if (!failedTokens.length) return;

    const userRepository = this._dataSource.getRepository(UserEntity);
    const user = await userRepository.findOneBy({ id: userId });

    if (!user) return;

    user.deviceTokens = (user.deviceTokens || []).filter(
      (token) => !failedTokens.includes(token),
    );
    await userRepository.save(user);
  }

  @Process(NotificationProcess.CAMPAIGN)
  async sendCampaign(job: Job<string>): Promise<void> {
    const campaignId = job.data;
    if (!campaignId) return;

    await this._campaignService.sendNotification(campaignId);
  }
}
