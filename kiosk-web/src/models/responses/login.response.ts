import { UserDto } from "../user.dto";

export class LoginResponse {
	user: UserDto;
	accessToken: string;
	expiresIn?: number;
}
