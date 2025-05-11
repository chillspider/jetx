import { AutoMap } from '@automapper/classes';
import { Column, Entity, ManyToOne, Unique } from 'typeorm';

import { AbstractEntity } from '../../../common/entities/abstract.entity';
import { NotificationEntity } from './notification.entity';

@Entity({ name: 'user_notifications', synchronize: false })
@Unique(['userId', 'notificationId'])
export class UserNotificationEntity extends AbstractEntity {
  @Column({ type: 'uuid' })
  @AutoMap()
  userId: string;

  @Column({ type: 'uuid' })
  @AutoMap()
  notificationId: string;

  @Column({ default: false })
  @AutoMap()
  isRead: boolean;

  @ManyToOne(
    () => NotificationEntity,
    (notification) => notification.userNotifications,
    { onDelete: 'CASCADE' },
  )
  notification?: NotificationEntity;
}
