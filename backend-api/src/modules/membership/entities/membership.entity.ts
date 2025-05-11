import { AutoMap } from '@automapper/classes';
import { Column, Entity, OneToMany } from 'typeorm';

import { AbstractEntity } from '../../../common/entities/abstract.entity';
import { MembershipType } from '../enums/membership-type.enum';
import { UserMembershipEntity } from './user-membership.entity';

@Entity({ name: 'memberships', synchronize: false })
export class MembershipEntity extends AbstractEntity {
  @Column()
  @AutoMap()
  name: string;

  @Column({ nullable: true })
  @AutoMap()
  description?: string;

  @Column({ nullable: true, default: MembershipType.BASIC })
  @AutoMap()
  type?: MembershipType;

  // days
  @Column({ default: 30 })
  @AutoMap()
  duration: number;

  @OneToMany(() => UserMembershipEntity, (rp) => rp.membership)
  userMemberships?: UserMembershipEntity[];
}
