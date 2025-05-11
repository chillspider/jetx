import { AuthProvider } from '../enums/auth-provider.enum';

export class LoginDto {
	token?: string;

	firstName?: string;

	lastName?: string;

	email?: string;

	password?: string;

	provider!: AuthProvider;
}
