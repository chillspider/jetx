// eslint-disable-next-line simple-import-sort/imports
import { MembershipCondition } from './membership-condition.dto';
import { MembershipStatus } from './membership-status.enum';
import { MembershipDto } from './membership.dto';

export class OrderMembershipDto {
	id!: string;

	startAt?: Date;

	endAt?: Date;

	status!: MembershipStatus;

	condition?: MembershipCondition;

	membership!: MembershipDto;
}
