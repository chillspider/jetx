import { AutoMap } from '@automapper/classes';
import { BeforeSoftRemove, Column, Entity, OneToMany, OneToOne } from 'typeorm';

import { AbstractEntity } from '../../../common/entities/abstract.entity';
import { markAsDeleted } from '../../../common/utils';
import { AuthProvider } from '../../auth/enums/auth-provider.enum';
import { UserMembershipEntity } from '../../membership/entities/user-membership.entity';
import { UserStatus } from '../enums/user-status.enum';
import { UserType } from '../enums/user-type.enum';
import { ReferralEntity } from './referral.entity';
import { UserRoleEntity } from './user-role.entity';
import { VehicleEntity } from './vehicle.entity';

@Entity({ name: 'users', synchronize: false })
export class UserEntity extends AbstractEntity {
  @Column({ nullable: true })
  @AutoMap()
  firstName?: string;

  @Column({ nullable: true })
  @AutoMap()
  lastName?: string;

  @Column({ unique: true, nullable: true })
  @AutoMap()
  email?: string;

  @Column({ nullable: true })
  password?: string;

  @Column({ nullable: true })
  @AutoMap()
  phone?: string;

  @Column({ nullable: true })
  @AutoMap()
  avatar?: string;

  @Column({ nullable: true })
  @AutoMap()
  provider?: AuthProvider;

  @Column({ nullable: true })
  @AutoMap()
  socialId?: string;

  @Column({ default: UserStatus.INACTIVE })
  @AutoMap()
  status!: UserStatus;

  @Column({ default: UserType.CLIENT })
  @AutoMap()
  type!: UserType;

  @Column({ nullable: true, type: 'jsonb', default: [] })
  @AutoMap(() => [String])
  deviceTokens: string[];

  @Column({ nullable: true })
  @AutoMap()
  note?: string;

  @Column({ nullable: true })
  @AutoMap()
  nflowId?: string;

  @Column({ nullable: true })
  @AutoMap()
  referralCode?: string;

  /// The first station where users washed car
  @Column({ nullable: true })
  @AutoMap()
  stationId?: string;

  @OneToMany(() => UserRoleEntity, (rp) => rp.user, { cascade: true })
  @AutoMap()
  userRoles?: UserRoleEntity[];

  @OneToMany(() => VehicleEntity, (e) => e.user)
  @AutoMap(() => [VehicleEntity])
  vehicles?: VehicleEntity[];

  @OneToMany(() => UserMembershipEntity, (rp) => rp.user)
  userMemberships?: UserMembershipEntity[];

  @OneToOne(() => ReferralEntity, (e) => e.referredUser)
  referred?: ReferralEntity;

  @OneToMany(() => ReferralEntity, (e) => e.referralUser)
  referrals?: ReferralEntity[];

  @BeforeSoftRemove()
  markAsDeleted() {
    this.email = markAsDeleted(this.email);
  }
}
