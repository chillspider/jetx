import { AutoMap } from '@automapper/classes';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

import { AbstractEntity } from '../../../common/entities/abstract.entity';
import { UserEntity } from '../../user/entities/user.entity';
import { MembershipCondition } from '../dtos/membership-condition.dto';
import { MembershipStatus } from '../enums/membership-status.enum';
import { MembershipEntity } from './membership.entity';

@Entity({ name: 'user_memberships', synchronize: false })
export class UserMembershipEntity extends AbstractEntity {
  @Column()
  @AutoMap()
  startAt: Date;

  @Column()
  @AutoMap()
  endAt: Date;

  @Column()
  @AutoMap()
  status: MembershipStatus;

  @Column('uuid')
  @AutoMap()
  userId: string;

  @Column('uuid')
  @AutoMap()
  membershipId: string;

  @Column({ type: 'jsonb', nullable: true, default: {} })
  @AutoMap(() => [MembershipCondition])
  condition?: MembershipCondition;

  @ManyToOne(() => UserEntity, (user) => user.userMemberships, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @ManyToOne(() => MembershipEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'membership_id' })
  @AutoMap(() => MembershipEntity)
  membership: MembershipEntity;
}
