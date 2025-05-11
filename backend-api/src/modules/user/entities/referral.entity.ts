import { AutoMap } from '@automapper/classes';
import { Column, Entity, JoinColumn, ManyToOne, OneToOne } from 'typeorm';

import { AbstractEntity } from '../../../common/entities/abstract.entity';
import { UserEntity } from './user.entity';

@Entity({ name: 'referrals', synchronize: false })
export class ReferralEntity extends AbstractEntity {
  @Column()
  @AutoMap()
  referralId: string;

  @Column()
  @AutoMap()
  referredId: string;

  @Column()
  @AutoMap()
  referralCode: string;

  @ManyToOne(() => UserEntity, (e) => e.referrals, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'referral_id', referencedColumnName: 'id' })
  referralUser!: UserEntity;

  @OneToOne(() => UserEntity, (e) => e.referred, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'referred_id', referencedColumnName: 'id' })
  referredUser!: UserEntity;
}
