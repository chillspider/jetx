import { AutoMap } from '@automapper/classes';
import { Column, Entity } from 'typeorm';

import { AbstractEntity } from '../../../common/entities/abstract.entity';
import { CampaignStatus } from '../enums/campaign-status.enum';
import { NotificationChannel } from '../enums/notification-channel.enum';
import { NotificationDeepLink } from '../enums/notification-deep-link.enum';

@Entity({ name: 'notification_campaigns', synchronize: false })
export class NotificationCampaignEntity extends AbstractEntity {
  @Column()
  @AutoMap()
  name: string;

  @Column({ nullable: true })
  @AutoMap()
  notifyContent?: string;

  @Column({ nullable: true })
  @AutoMap()
  emailContent?: string;

  @Column({ type: 'jsonb', default: [], nullable: true })
  @AutoMap(() => [String])
  targetUsers?: string[];

  @Column({ nullable: true })
  @AutoMap()
  scheduleTime?: Date;

  @Column({ default: CampaignStatus.ACTIVATED })
  @AutoMap()
  status: CampaignStatus;

  @Column({ default: NotificationChannel.APP_PUSH })
  @AutoMap()
  channel: NotificationChannel;

  @Column({ default: 0 })
  @AutoMap()
  reach: number;

  @Column({ nullable: true })
  @AutoMap()
  nflowId?: string;

  @Column({ nullable: true })
  @AutoMap()
  deepLink?: NotificationDeepLink;
}
