import { IsObject, IsOptional } from 'class-validator';

import {
  ClassField,
  EnumField,
  NumberFieldOptional,
  StringField,
  StringFieldOptional,
} from '../../../decorators';
import { NotificationType } from '../enums/notification.enum';
import { NotificationDeepLink } from '../enums/notification-deep-link.enum';

export class NotificationMessage {
  @StringField()
  title: string;

  @StringField()
  body: string;

  @StringFieldOptional()
  imageUrl?: string;
}

export class NotificationPayload {
  @ClassField(() => NotificationMessage)
  notification: NotificationMessage;

  @NumberFieldOptional()
  ttl?: number;

  @NumberFieldOptional()
  badge?: number;

  @EnumField(() => NotificationType)
  type: NotificationType;

  @IsObject()
  @IsOptional()
  data?: Record<string, any>;

  @StringFieldOptional()
  deepLink?: NotificationDeepLink;
}

export class NotificationTopicPayload extends NotificationPayload {
  @StringField()
  topic: string;
}

export class NotificationTokenPayload extends NotificationPayload {
  @StringField()
  token: string;
}

export class NotificationMulticastPayload extends NotificationPayload {
  @StringField()
  tokens: string[];
}
