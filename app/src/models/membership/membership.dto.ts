import { MembershipType } from './membership-type.enum';

export class MembershipDto {
	id!: string;

	name?: string;

	description?: string;

	type!: MembershipType;

	duration?: number;
}
