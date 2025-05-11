import { Mapper } from '@automapper/core';
import { InjectMapper } from '@automapper/nestjs';
import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Queue } from 'bull';
import { v4 as uuid } from 'uuid';

import { shortenText } from '../../../common/utils';
import { EVENT, QUEUE } from '../../../constants';
import { NotificationDto } from '../../notification/dtos/notification.dto';
import {
  NotificationProcess,
  NotificationType,
} from '../../notification/enums/notification.enum';
import { NotificationDeepLink } from '../../notification/enums/notification-deep-link.enum';
import { SupportDto } from '../dtos/support.dto';
import { SupportEntity } from '../entities/support.entity';
import { SupportStatus } from '../enums/support-status.enum';

@Injectable()
export class SupportListener {
  constructor(
    @InjectMapper() private readonly _mapper: Mapper,
    @InjectQueue(QUEUE.NOTIFICATION)
    private readonly _queue: Queue<NotificationDto>,
  ) {}

  @OnEvent(EVENT.SUPPORT.NOTIFICATION)
  public async sendNotification(
    support: SupportEntity,
    lang?: string,
  ): Promise<void> {
    if (!support) return;

    if (support.status === SupportStatus.OPEN) {
      return;
    }

    const title = `notification.support.title.${support.status}`;
    const content = `notification.support.content.${support.status}`;

    const data = this._mapper.map(support, SupportEntity, SupportDto);

    const notification: NotificationDto = {
      id: uuid(),
      lang,
      userId: support.customerId,
      title,
      content,
      type: NotificationType.SUPPORT,
      data: {
        ...data,
        title: shortenText(data.title) ?? shortenText(data.content),
      },
      deepLink: NotificationDeepLink.SupportDetail,
    };

    await this._queue.add(NotificationProcess.CUSTOMER, notification);
  }
}
