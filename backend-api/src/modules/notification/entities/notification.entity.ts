import { AutoMap } from '@automapper/classes';
import { Column, Entity, OneToMany } from 'typeorm';

import { AbstractEntity } from '../../../common/entities/abstract.entity';
import {
  NotificationTarget,
  NotificationType,
} from '../enums/notification.enum';
import { NotificationChannel } from '../enums/notification-channel.enum';
import { NotificationDeepLink } from '../enums/notification-deep-link.enum';
import { UserNotificationEntity } from './user-notification.entity';

@Entity({ name: 'notifications', synchronize: false })
export class NotificationEntity extends AbstractEntity {
  @Column()
  @AutoMap()
  title: string;

  @Column({ nullable: true })
  @AutoMap()
  content?: string;

  /** @deprecated use userNotifications instead */
  @Column('uuid', { nullable: true })
  @AutoMap()
  userId?: string;

  /** @deprecated use userNotifications instead */
  @Column({ default: false, nullable: true })
  @AutoMap()
  isRead?: boolean;

  @Column()
  @AutoMap()
  type: NotificationType;

  @Column({ type: 'jsonb', default: {}, nullable: true })
  @AutoMap()
  data: Record<string, any>;

  @Column({ type: 'uuid', nullable: true })
  @AutoMap()
  campaignId?: string;

  @Column({ default: NotificationTarget.SPECIFIC })
  @AutoMap()
  target: NotificationTarget;

  @Column({ default: NotificationChannel.APP_PUSH })
  @AutoMap()
  channel: NotificationChannel;

  @Column({ nullable: true })
  @AutoMap()
  deepLink?: NotificationDeepLink;

  @OneToMany(() => UserNotificationEntity, (rp) => rp.notification)
  userNotifications?: UserNotificationEntity[];
}
