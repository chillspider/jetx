import { AbstractDto } from "./abstract.dto";

export class UserDto extends AbstractDto {
	firstName?: string;
	lastName?: string;
	fullName?: string;
	email?: string;
	avatar?: string;
	phone?: string;
	socialId?: string;
	deviceTokens: string[];
	note?: string;
	referralCode?: string;
	isReferred: boolean;
	kioskId?: string;
}
