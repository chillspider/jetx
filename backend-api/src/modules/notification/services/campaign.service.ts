import { Mapper } from '@automapper/core';
import { InjectMapper } from '@automapper/nestjs';
import { InjectQueue } from '@nestjs/bull';
import { BadRequestException, Injectable, OnModuleInit } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SchedulerRegistry } from '@nestjs/schedule';
import { Queue } from 'bull';
import { CronJob } from 'cron';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { isUndefined, omitBy, uniq } from 'lodash';
import { DataSource, In, IsNull, Not, Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

import { normalizeEmail } from '../../../common/utils';
import { CRON, EVENT, QUEUE } from '../../../constants';
import { SyncActionEnum } from '../../../constants/action';
import { W24Error } from '../../../constants/error-code';
import { FCMService } from '../../../shared/services/fcm.service';
import { LoggerService } from '../../../shared/services/logger.service';
import { MailService } from '../../mail/services/mail.service';
import { UserEntity } from '../../user/entities/user.entity';
import { UserType } from '../../user/enums/user-type.enum';
import {
  NflowCampaignDto,
  UpdateNflowCampaignDto,
} from '../dtos/nflow-campaign.dto';
import {
  NotificationMulticastPayload,
  NotificationPayload,
} from '../dtos/notification-payload.dto';
import { CreateCampaignDto } from '../dtos/requests/create-campaign.request.dto';
import { NotificationEntity } from '../entities/notification.entity';
import { NotificationCampaignEntity } from '../entities/notification-campaign.entity';
import { UserNotificationEntity } from '../entities/user-notification.entity';
import { CampaignStatus } from '../enums/campaign-status.enum';
import {
  NotificationProcess,
  NotificationTarget,
  NotificationType,
} from '../enums/notification.enum';
import { NotificationChannel } from '../enums/notification-channel.enum';

dayjs.extend(utc);

@Injectable()
export class CampaignService implements OnModuleInit {
  private readonly _campaignRepository: Repository<NotificationCampaignEntity>;

  constructor(
    @InjectMapper() private readonly _mapper: Mapper,
    @InjectQueue(QUEUE.NOTIFICATION)
    private readonly _queue: Queue<string>,
    private readonly _dataSource: DataSource,
    private readonly _logger: LoggerService,
    private readonly _scheduler: SchedulerRegistry,
    private readonly _mailService: MailService,
    private readonly _fcm: FCMService,
    private readonly _emitter: EventEmitter2,
  ) {
    this._campaignRepository = this._dataSource.getRepository(
      NotificationCampaignEntity,
    );
  }

  onModuleInit() {
    this.runPendingCampaigns();
  }

  private async runPendingCampaigns() {
    const campaigns = await this._campaignRepository.find({
      where: {
        status: CampaignStatus.ACTIVATED,
        scheduleTime: Not(IsNull()),
      },
      select: ['id', 'scheduleTime', 'status'],
    });
    if (!campaigns?.length) return;

    campaigns.forEach((campaign) => {
      this.processCampaign(campaign);
    });
  }

  public async createByNflow(
    dto: NflowCampaignDto,
  ): Promise<NotificationCampaignEntity> {
    const entity = this._mapper.map(
      dto,
      NflowCampaignDto,
      NotificationCampaignEntity,
    );

    try {
      const campaign = await this._campaignRepository.save(entity);

      await this.processCampaign(campaign);
      return campaign;
    } catch (error) {
      this._logger.error(error);
      throw new BadRequestException(error);
    }
  }

  public async create(
    dto: CreateCampaignDto,
  ): Promise<NotificationCampaignEntity> {
    const entity = this._mapper.map(
      dto,
      CreateCampaignDto,
      NotificationCampaignEntity,
    );

    try {
      const campaign = await this._campaignRepository.save(entity);

      await this.processCampaign(campaign);
      return campaign;
    } catch (error) {
      this._logger.error(error);
      throw new BadRequestException(error);
    }
  }

  public async deactivate(id: string): Promise<boolean> {
    const campaign = await this.getCampaignUpdate(id);
    this.removeCronJob(campaign.id);

    try {
      await this._campaignRepository.update(id, {
        status: CampaignStatus.DEACTIVATED,
      });
      return true;
    } catch (error) {
      this._logger.error(error);
      throw new BadRequestException(error);
    }
  }

  public async update(
    dto: UpdateNflowCampaignDto,
  ): Promise<NotificationCampaignEntity> {
    if (!dto.id) {
      throw new BadRequestException(W24Error.MissingRequiredField('Id'));
    }

    const campaign = await this.getCampaignUpdate(dto.id);
    this.removeCronJob(campaign.id);

    try {
      const entity = omitBy(
        this._mapper.map(
          dto,
          UpdateNflowCampaignDto,
          NotificationCampaignEntity,
        ),
        isUndefined,
      );

      const entityUpdate: NotificationCampaignEntity = {
        ...campaign,
        ...entity,
      };

      await this._campaignRepository.save(entityUpdate);

      if (entityUpdate.status === CampaignStatus.ACTIVATED) {
        await this.processCampaign(entityUpdate);
      }

      return entityUpdate;
    } catch (error) {
      this._logger.error(error);
      throw new BadRequestException(error);
    }
  }

  private async getCampaignUpdate(
    campaignId: string,
  ): Promise<NotificationCampaignEntity> {
    const campaign = await this._campaignRepository.findOneBy({
      id: campaignId,
      status: CampaignStatus.ACTIVATED,
      scheduleTime: Not(IsNull()),
    });
    if (!campaign) throw new BadRequestException(W24Error.NotFound('Campaign'));

    const isExist = this._scheduler.doesExist(
      'cron',
      CRON.CAMPAIGN(campaign.id),
    );
    if (!isExist) {
      throw new BadRequestException(W24Error.CampaignIsProcessing);
    }

    return campaign;
  }

  private async processCampaign(
    campaign: NotificationCampaignEntity,
  ): Promise<void> {
    if (campaign.status !== CampaignStatus.ACTIVATED) {
      return;
    }

    if (campaign.scheduleTime != null) {
      // ! Schedule campaign
      const scheduleTime = dayjs(campaign.scheduleTime).utc();
      const now = dayjs().utc();

      if (scheduleTime.isAfter(now)) {
        this.addCronJob(campaign.id, scheduleTime.toDate());
        return;
      }
    }

    await this.sendCampaign(campaign.id);
  }

  private async sendCampaign(campaignId: string): Promise<void> {
    await this._queue.add(NotificationProcess.CAMPAIGN, campaignId, {
      jobId: campaignId,
    });
  }

  private addCronJob(campaignId: string, scheduleTime: Date): boolean {
    try {
      const isExist = this._scheduler.doesExist(
        'cron',
        CRON.CAMPAIGN(campaignId),
      );
      if (isExist) return true;

      const job: CronJob = new CronJob(scheduleTime, async () => {
        await this.sendCampaign(campaignId);
      });

      this._scheduler.addCronJob(CRON.CAMPAIGN(campaignId), job);
      job.start();

      this._logger.info(`Campaign ${campaignId} scheduled at ${scheduleTime}`);
      return true;
    } catch (error) {
      this._logger.error(error);
      return false;
    }
  }

  private removeCronJob(campaignId: string): boolean {
    try {
      this._scheduler.deleteCronJob(CRON.CAMPAIGN(campaignId));
      this._logger.info(`Campaign ${campaignId} removed from scheduler`);
      return true;
    } catch (error) {
      this._logger.error(error);
      return false;
    }
  }

  public async sendNotification(campaignId: string): Promise<boolean> {
    const campaign = await this._campaignRepository.findOneBy({
      id: campaignId,
      status: CampaignStatus.ACTIVATED,
    });
    if (!campaign) {
      this.removeCronJob(campaignId);
      return false;
    }

    const isAllUser = !campaign.targetUsers?.length;

    let result: {
      success: boolean;
      reach?: number;
    };

    if (isAllUser) {
      result = await this.sendAllUserNotification(campaign);
    } else {
      result = await this.sendSpecificUserNotification(campaign);
    }

    if (result.success) {
      await this._campaignRepository.update(campaign.id, {
        status: CampaignStatus.SUCCEEDED,
        reach: 0, // TODO: update reach
      });
    } else {
      await this._campaignRepository.update(campaign.id, {
        status: CampaignStatus.FAILED,
      });
    }

    this.removeCronJob(campaignId);
    this._emitter.emit(EVENT.SYNC.CAMPAIGN, {
      id: campaignId,
      action: SyncActionEnum.Sync,
    });
    return result.success;
  }

  private async sendAllUserNotification(
    campaign: NotificationCampaignEntity,
  ): Promise<{
    success: boolean;
    reach?: number;
  }> {
    try {
      const notification = await this.prepareNotification(campaign);
      if (!notification) return { success: false };

      const isAppPush = campaign.channel === NotificationChannel.APP_PUSH;
      if (isAppPush) {
        // ! Send app push
        const payload: NotificationPayload = {
          notification: {
            title: notification.title,
            body: notification.content,
          },
          type: notification.type,
          data: notification.data,
          deepLink: notification.deepLink,
        };

        const sendResult = await this._fcm.sendAll(payload);
        return { success: !!sendResult };
      }

      console.time(`[CAMPAIGN] send mail for all users >>>>`);

      // ! Send email
      const batchSize = 2000;
      let offset: number = 0;
      let users: UserEntity[] = [];

      do {
        users = await this._dataSource.getRepository(UserEntity).find({
          where: { type: UserType.CLIENT },
          select: ['id', 'email'],
          take: batchSize,
          skip: offset,
        });

        const emails = uniq(
          (users || []).map((user) => normalizeEmail(user.email)),
        );

        if (emails.length > 0) {
          this._mailService.sendMail({
            bcc: emails,
            subject: notification.title,
            html: notification.content,
          });
        }

        offset += batchSize;
      } while (users.length === batchSize); // Continue until there are no more users

      console.timeEnd(`[CAMPAIGN] send mail for all users >>>>`);

      return {
        success: true,
        reach: 0,
      };
    } catch (error) {
      this._logger.error(error);
      return { success: false };
    }
  }

  private async sendSpecificUserNotification(
    campaign: NotificationCampaignEntity,
  ): Promise<{
    success: boolean;
    reach?: number;
  }> {
    try {
      const users = await this._dataSource.getRepository(UserEntity).find({
        where: { type: UserType.CLIENT, email: In(campaign.targetUsers) },
        select: ['id', 'email', 'deviceTokens'],
      });
      if (!users?.length) return { success: false };

      const notification = await this.prepareNotification(campaign, users);
      if (!notification) return { success: false };

      const isAppPush = campaign.channel === NotificationChannel.APP_PUSH;
      if (isAppPush) {
        // ! Send app push
        const tokens = users.flatMap((user) => user.deviceTokens);
        if (!tokens?.length) return { success: false };

        const payload: NotificationMulticastPayload = {
          notification: {
            title: notification.title,
            body: notification.content,
          },
          type: notification.type,
          data: notification.data,
          tokens: tokens,
          deepLink: notification.deepLink,
        };

        const sendResult = await this._fcm.sendMulticast(payload);
        return { success: !!sendResult, reach: sendResult?.successCount };
      }

      // ! Send email
      const emails = uniq(users.map((user) => normalizeEmail(user.email)));
      if (!emails?.length) return { success: false };

      const result = await this._mailService.sendMail({
        bcc: emails,
        subject: notification.title,
        html: notification.content,
      });

      const acceptedCount = (result?.accepted || []).length;

      return {
        success: !!acceptedCount,
        reach: acceptedCount,
      };
    } catch (error) {
      this._logger.error(error);
      return { success: false };
    }
  }

  private async prepareNotification(
    campaign: NotificationCampaignEntity,
    users?: UserEntity[],
  ): Promise<NotificationEntity> {
    const isExistNotification = await this._dataSource
      .getRepository(NotificationEntity)
      .findOneBy({ campaignId: campaign.id });
    if (isExistNotification) {
      throw new BadRequestException(W24Error.CampaignAlreadySent);
    }

    const isAppPush = campaign.channel === NotificationChannel.APP_PUSH;
    const isAllUser = !campaign.targetUsers?.length;

    const notification: Partial<NotificationEntity> = {
      id: uuidv4(),
      title: campaign.name,
      content: isAppPush ? campaign.notifyContent : campaign.emailContent,
      type: NotificationType.CAMPAIGN,
      campaignId: campaign.id,
      target: isAllUser ? NotificationTarget.ALL : NotificationTarget.SPECIFIC,
      channel: campaign.channel,
      deepLink: campaign.deepLink,
    };
    if (!notification.content) return null;

    let userNotifications: Array<Partial<UserNotificationEntity>> = [];

    if (!isAllUser) {
      userNotifications = (users || []).map((user) => ({
        userId: user.id,
        notificationId: notification.id,
        isRead: false,
      }));
    }

    return this._dataSource.transaction(async (manager) => {
      const entity = await manager
        .getRepository(NotificationEntity)
        .save(notification);

      if (userNotifications.length) {
        await manager
          .getRepository(UserNotificationEntity)
          .save(userNotifications);
      }

      return entity;
    });
  }
}
