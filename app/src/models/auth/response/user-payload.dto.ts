import { AbstractDto } from '@/models/commons/abstract.dto';

import { AuthProvider, UserStatus } from '../enums/auth-provider.enum';

export class UserPayloadDto extends AbstractDto {
	firstName?: string;

	lastName?: string;

	fullName?: string;

	email?: string;

	phone?: string;

	provider?: AuthProvider;

	socialId?: string;

	referralCode?: string;

	isReferred?: boolean;

	status!: UserStatus;
}
