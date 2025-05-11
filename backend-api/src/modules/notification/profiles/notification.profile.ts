import {
  createMap,
  forMember,
  mapFrom,
  Mapper,
  MappingProfile,
} from '@automapper/core';
import { AutomapperProfile, InjectMapper } from '@automapper/nestjs';
import { Injectable } from '@nestjs/common';

import {
  MappingCampaign,
  NflowCampaignDto,
  UpdateNflowCampaignDto,
} from '../dtos/nflow-campaign.dto';
import { NotificationDto } from '../dtos/notification.dto';
import { CreateCampaignDto } from '../dtos/requests/create-campaign.request.dto';
import { NotificationEntity } from '../entities/notification.entity';
import { NotificationCampaignEntity } from '../entities/notification-campaign.entity';
import { UserNotificationEntity } from '../entities/user-notification.entity';

@Injectable()
export class NotificationProfile extends AutomapperProfile {
  constructor(@InjectMapper() mapper: Mapper) {
    super(mapper);
  }

  get profile(): MappingProfile {
    return (mapper) => {
      createMap(
        mapper,
        NotificationEntity,
        NotificationDto,
        forMember(
          (d) => d.data,
          mapFrom((s) => s.data),
        ),
      );
      createMap(mapper, NotificationDto, NotificationEntity);
      createMap(mapper, CreateCampaignDto, NotificationCampaignEntity);
      createMap(
        mapper,
        NflowCampaignDto,
        NotificationCampaignEntity,
        forMember(
          (d) => d.channel,
          mapFrom((s) => MappingCampaign.Channel[s.channel]),
        ),
        forMember(
          (d) => d.status,
          mapFrom((s) => MappingCampaign.Status[s.status]),
        ),
      );
      createMap(
        mapper,
        UpdateNflowCampaignDto,
        NotificationCampaignEntity,
        forMember(
          (d) => d.channel,
          mapFrom((s) => MappingCampaign.Channel[s.channel]),
        ),
        forMember(
          (d) => d.status,
          mapFrom((s) => MappingCampaign.Status[s.status]),
        ),
      );
      createMap(
        mapper,
        NotificationCampaignEntity,
        NflowCampaignDto,
        forMember(
          (d) => d.channel,
          mapFrom((s) => MappingCampaign.ChannelReverse[s.channel]),
        ),
        forMember(
          (d) => d.status,
          mapFrom((s) => MappingCampaign.StatusReverse[s.status]),
        ),
      );
      createMap(
        mapper,
        UserNotificationEntity,
        NotificationDto,
        forMember(
          (d) => d.title,
          mapFrom((s) => s?.notification?.title),
        ),
        forMember(
          (d) => d.content,
          mapFrom((s) => s?.notification?.content),
        ),
        forMember(
          (d) => d.data,
          mapFrom((s) => s?.notification?.data),
        ),
        forMember(
          (d) => d.type,
          mapFrom((s) => s?.notification?.type),
        ),
        forMember(
          (d) => d.id,
          mapFrom((s) => s?.notification?.id),
        ),
      );
    };
  }
}
