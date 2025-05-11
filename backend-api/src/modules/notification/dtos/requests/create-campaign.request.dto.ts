import { AutoMap } from '@automapper/classes';

import {
  DateFieldOptional,
  EnumField,
  StringField,
  StringFieldOptional,
} from '../../../../decorators';
import { CampaignStatus } from '../../enums/campaign-status.enum';
import { NotificationChannel } from '../../enums/notification-channel.enum';

export class CreateCampaignDto {
  @StringField()
  @AutoMap()
  name: string;

  @StringFieldOptional()
  @AutoMap()
  notifyContent?: string;

  @StringFieldOptional()
  @AutoMap()
  emailContent?: string;

  @StringFieldOptional({ isArray: true, each: true })
  @AutoMap(() => [String])
  targetUsers?: string[];

  @DateFieldOptional()
  @AutoMap()
  scheduleTime?: Date;

  @EnumField(() => CampaignStatus)
  @AutoMap()
  status: CampaignStatus;

  @EnumField(() => NotificationChannel)
  @AutoMap()
  channel: NotificationChannel;

  @StringFieldOptional()
  @AutoMap()
  nflowId?: string;

  @StringFieldOptional()
  @AutoMap()
  deepLink?: string;
}
