import { Mapper } from '@automapper/core';
import { InjectMapper } from '@automapper/nestjs';
import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import dayjs from 'dayjs';
import { Brackets, DataSource, Repository } from 'typeorm';

import { PaginationRequestDto } from '../../../common/dto/pagination-request.dto';
import { getUtcNow } from '../../../common/utils';
import { LANGUAGE } from '../../../constants';
import { FCMService } from '../../../shared/services/fcm.service';
import { LoggerService } from '../../../shared/services/logger.service';
import { TranslationService } from '../../../shared/services/translation.service';
import { NotificationDto } from '../dtos/notification.dto';
import { NotificationPayload } from '../dtos/notification-payload.dto';
import { NotificationRequestDto } from '../dtos/requests/notification.request';
import { NotificationPaginationResponse } from '../dtos/responses/notification-paginate.response';
import { NotificationEntity } from '../entities/notification.entity';
import { UserNotificationEntity } from '../entities/user-notification.entity';
import {
  NotificationTarget,
  NotificationType,
} from '../enums/notification.enum';
import { NotificationChannel } from '../enums/notification-channel.enum';

@Injectable()
export class NotificationService {
  private _notificationRepository: Repository<NotificationEntity>;
  private _userNotificationRepo: Repository<UserNotificationEntity>;

  constructor(
    @InjectMapper() private readonly _mapper: Mapper,
    @Inject(LANGUAGE) private readonly _lang: string,
    @Inject(REQUEST) private readonly req: any,
    private readonly _dataSource: DataSource,
    private readonly _logger: LoggerService,
    private readonly _translate: TranslationService,
    private readonly _fcm: FCMService,
  ) {
    this._notificationRepository =
      this._dataSource.getRepository(NotificationEntity);
    this._userNotificationRepo = this._dataSource.getRepository(
      UserNotificationEntity,
    );
  }

  public async getNotifications(
    query: PaginationRequestDto,
  ): Promise<NotificationPaginationResponse> {
    const userId = this.req?.user?.id;
    if (!userId) throw new ForbiddenException();

    const thirtyDaysAgo = dayjs(getUtcNow()).subtract(30, 'day').toDate();

    const builder = this._notificationRepository
      .createQueryBuilder('notifications')
      .withDeleted()
      .leftJoinAndSelect(
        'notifications.userNotifications',
        'userNotifications',
        'userNotifications.userId = :userId',
        { userId },
      )
      .andWhere({ channel: NotificationChannel.APP_PUSH })
      .andWhere('notifications.createdAt >= :thirtyDaysAgo', {
        thirtyDaysAgo,
      })
      .andWhere('notifications.deletedAt IS NULL')
      .andWhere('userNotifications.deletedAt IS NULL')
      .andWhere(
        new Brackets((qb) => {
          qb.where('userNotifications.userId IS NOT NULL').orWhere(
            'notifications.target = :target',
            { target: NotificationTarget.ALL },
          );
        }),
      );

    const [items, meta] = await builder
      .orderBy('notifications.createdAt', query.order)
      .paginate(query);

    const totalUnread = await builder
      .andWhere(
        new Brackets((qb) => {
          qb.where('userNotifications.isRead = false').orWhere(
            'userNotifications.userId IS NULL AND notifications.target = :unReadTarget',
            { unReadTarget: NotificationTarget.ALL },
          );
        }),
      )
      .getCount();

    const notifications = items.map((e) => ({
      ...this._mapper.map(e, NotificationEntity, NotificationDto),
      isRead: e.userNotifications?.[0]?.isRead || false,
      userId: e.userNotifications?.[0]?.userId || userId,
    }));

    for (const e of notifications) {
      const [title, content] = this._translate.translates([
        { key: e.title, options: { args: e.data, lang: this._lang } },
        { key: e.content, options: { args: e.data, lang: this._lang } },
      ]);

      e.title = title;
      e.content = content;
    }

    return {
      ...notifications.toPagination(meta),
      totalUnread,
    };
  }

  async readNotification(id: string, isRead: boolean): Promise<boolean> {
    const userId = this.req?.user?.id;
    if (!userId) throw new ForbiddenException();

    try {
      const notification = await this._notificationRepository.findOneBy({ id });
      if (!notification) return false;

      const userNotification = await this._userNotificationRepo.findOneBy({
        notificationId: id,
        userId: userId,
      });

      // Consolidated update logic
      if (
        notification.target === NotificationTarget.SPECIFIC ||
        userNotification
      ) {
        const result = await this._userNotificationRepo.update(
          { notificationId: id, userId: userId },
          { isRead: isRead },
        );
        return !!result?.affected;
      }

      // Create a new user notification if it doesn't exist
      const result = await this._userNotificationRepo.save({
        notificationId: id,
        userId: userId,
        isRead: isRead,
      });

      return !!result;
    } catch (error) {
      this._logger.error(error);
      return false;
    }
  }

  public async markAllAsRead(): Promise<boolean> {
    const userId = this.req?.user?.id;
    if (!userId) throw new ForbiddenException();

    try {
      const unseenAllNotifications = await this._notificationRepository
        .createQueryBuilder('notifications')
        .withDeleted()
        .leftJoinAndSelect(
          'notifications.userNotifications',
          'userNotifications',
          'userNotifications.userId = :userId',
          { userId },
        )
        .where({
          target: NotificationTarget.ALL,
          channel: NotificationChannel.APP_PUSH,
        })
        .andWhere('notifications.deletedAt IS NULL')
        .andWhere('userNotifications.deletedAt IS NULL')
        .andWhere('userNotifications.userId IS NULL')
        .getMany();

      return this._dataSource.transaction(async (manager) => {
        await this._userNotificationRepo.update(
          { userId: userId, isRead: false },
          { isRead: true },
        );

        if (unseenAllNotifications?.length) {
          const readAllNotifications: Array<Partial<UserNotificationEntity>> =
            unseenAllNotifications.map((e) => ({
              notificationId: e.id,
              userId: userId,
              isRead: true,
            }));

          await manager
            .getRepository(UserNotificationEntity)
            .save(readAllNotifications);
        }

        return true;
      });
    } catch (error) {
      this._logger.error(error);
      return false;
    }
  }

  public async delete(id: string): Promise<boolean> {
    const userId = this.req?.user?.id;
    if (!userId) throw new ForbiddenException();

    try {
      const notification = await this._notificationRepository.findOneBy({
        id,
      });
      if (!notification) return false;

      const userNotification = await this._userNotificationRepo.findOneBy({
        notificationId: id,
        userId: userId,
      });

      if (
        notification.target === NotificationTarget.SPECIFIC ||
        userNotification
      ) {
        if (!userNotification) return false;

        await this._userNotificationRepo.softRemoveAndSave(userNotification);
        return true;
      }

      await this._userNotificationRepo.save({
        userId: userId,
        notificationId: id,
        isRead: true,
        deletedAt: getUtcNow(),
        deletedBy: userId,
      });
      return true;
    } catch (error) {
      this._logger.error(error);
      return false;
    }
  }

  public async notifyAll(dto: NotificationRequestDto): Promise<string> {
    const { title, message } = dto;
    const payload: NotificationPayload = {
      notification: { title, body: message },
      type: NotificationType.INFO,
      data: {},
    };

    return this._fcm.sendAll(payload);
  }
}
