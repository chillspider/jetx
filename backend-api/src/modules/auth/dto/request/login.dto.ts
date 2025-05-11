import {
  EnumField,
  StringField,
  StringFieldOptional,
} from '../../../../decorators';
import { AuthProvider } from '../../enums/auth-provider.enum';

export class LoginDto {
  @StringFieldOptional()
  readonly token?: string;

  @StringFieldOptional()
  readonly firstName?: string;

  @StringFieldOptional()
  readonly lastName?: string;

  @StringFieldOptional()
  readonly email?: string;

  @StringFieldOptional()
  readonly password?: string;

  @EnumField(() => AuthProvider)
  readonly provider!: AuthProvider;
}

export class AssistantLoginDto {
  @StringField()
  readonly email!: string;

  @StringField()
  readonly password!: string;
}
