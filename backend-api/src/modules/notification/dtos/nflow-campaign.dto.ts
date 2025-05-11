import { AutoMap } from '@automapper/classes';

import {
  DateFieldOptional,
  EnumField,
  EnumFieldOptional,
  NumberFieldOptional,
  StringFieldOptional,
  UUIDFieldOptional,
} from '../../../decorators';
import { CampaignStatus } from '../enums/campaign-status.enum';
import { NotificationChannel } from '../enums/notification-channel.enum';

export enum NflowCampaignStatus {
  ACTIVE = 'active',
  DEACTIVE = 'deactive',
  SUCCEEDED = 'succeeded',
  FAILED = 'failed',
}

export enum NflowCampaignChannel {
  PUSH_NOTIFY = 'pushNotify',
  EMAIL = 'email',
}
export class BaseNflowCampaignDto {
  @StringFieldOptional()
  @AutoMap()
  name?: string;

  @StringFieldOptional({ isArray: true, each: true })
  @AutoMap(() => [String])
  targetUsers?: string[];

  @StringFieldOptional()
  @AutoMap()
  emailContent?: string;

  @StringFieldOptional()
  @AutoMap()
  notifyContent?: string;

  @EnumFieldOptional(() => NflowCampaignStatus)
  @AutoMap()
  status?: NflowCampaignStatus;

  @EnumFieldOptional(() => NflowCampaignChannel)
  @AutoMap()
  channel?: NflowCampaignChannel;

  @DateFieldOptional()
  @AutoMap()
  scheduleTime?: Date;

  @NumberFieldOptional()
  @AutoMap()
  reach?: number;

  @StringFieldOptional()
  @AutoMap()
  deepLink?: string;
}

export class NflowCampaignDto extends BaseNflowCampaignDto {
  @EnumField(() => NflowCampaignStatus)
  @AutoMap()
  declare status: NflowCampaignStatus;

  @EnumField(() => NflowCampaignChannel)
  @AutoMap()
  declare channel: NflowCampaignChannel;
}

export class UpdateNflowCampaignDto extends BaseNflowCampaignDto {
  @UUIDFieldOptional()
  @AutoMap()
  id?: string;
}

export const MappingCampaign = {
  Channel: {
    [NflowCampaignChannel.PUSH_NOTIFY]: NotificationChannel.APP_PUSH,
    [NflowCampaignChannel.EMAIL]: NotificationChannel.EMAIL,
  },
  ChannelReverse: {
    [NotificationChannel.APP_PUSH]: NflowCampaignChannel.PUSH_NOTIFY,
    [NotificationChannel.EMAIL]: NflowCampaignChannel.EMAIL,
  },
  Status: {
    [NflowCampaignStatus.ACTIVE]: CampaignStatus.ACTIVATED,
    [NflowCampaignStatus.DEACTIVE]: CampaignStatus.DEACTIVATED,
    [NflowCampaignStatus.SUCCEEDED]: CampaignStatus.SUCCEEDED,
    [NflowCampaignStatus.FAILED]: CampaignStatus.FAILED,
  },
  StatusReverse: {
    [CampaignStatus.ACTIVATED]: NflowCampaignStatus.ACTIVE,
    [CampaignStatus.DEACTIVATED]: NflowCampaignStatus.DEACTIVE,
    [CampaignStatus.SUCCEEDED]: NflowCampaignStatus.SUCCEEDED,
    [CampaignStatus.FAILED]: NflowCampaignStatus.FAILED,
  },
};
