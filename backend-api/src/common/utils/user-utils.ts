import dayjs from 'dayjs';

import { REFERRAL_SUBMIT_EXPIRE } from '../../constants/config';
import { UserEntity } from '../../modules/user/entities/user.entity';
import { getUtcNow } from './date-utils';

export function canSubmitReferral(user: UserEntity): boolean {
  if (user.referred) {
    return false;
  }

  // Validate user created at not more than 7 days
  const dayInMinutes = REFERRAL_SUBMIT_EXPIRE * 24 * 60;

  const diff = dayjs(getUtcNow()).diff(dayjs(user.createdAt), 'm');
  return diff <= dayInMinutes;
}
