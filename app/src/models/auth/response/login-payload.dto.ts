import { UserPayloadDto } from './user-payload.dto';

export class LoginPayloadDto {
	user!: UserPayloadDto;

	expiresIn?: number;

	accessToken!: string;

	refreshToken?: string;
}
