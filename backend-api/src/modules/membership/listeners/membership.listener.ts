import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { DataSource, LessThanOrEqual } from 'typeorm';

import { getUtcNow } from '../../../common/utils';
import { EVENT } from '../../../constants';
import { UserMembershipEntity } from '../entities/user-membership.entity';
import { MembershipStatus } from '../enums/membership-status.enum';

@Injectable()
export class MembershipListener {
  constructor(private readonly _dataSource: DataSource) {}

  @OnEvent(EVENT.MEMBERSHIP.UPDATE_EXPIRED)
  async updateExpiredMemberships(): Promise<void> {
    await this._dataSource
      .getRepository(UserMembershipEntity)
      .createQueryBuilder('userMemberships')
      .update(UserMembershipEntity)
      .set({ status: MembershipStatus.INACTIVE })
      .where({ status: MembershipStatus.ACTIVE })
      .andWhere({ endAt: LessThanOrEqual(getUtcNow()) })
      .execute();
  }
}
