import { AutoMap } from '@automapper/classes';

import { AbstractDto } from '../../../common/dto/abstract.dto';
import { NotificationType } from '../enums/notification.enum';
import { NotificationDeepLink } from '../enums/notification-deep-link.enum';

export class NotificationDto extends AbstractDto {
  @AutoMap()
  lang: string;

  @AutoMap()
  title: string;

  @AutoMap()
  content: string;

  @AutoMap()
  userId?: string;

  @AutoMap()
  isRead?: boolean;

  @AutoMap()
  type: NotificationType;

  @AutoMap()
  data: Record<string, any>;

  @AutoMap()
  deepLink?: NotificationDeepLink;
}
