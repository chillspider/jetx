import { EmailField, PasswordField, StringField } from '../../../../decorators';

export class ResetPasswordRequestDto {
  @EmailField()
  readonly email!: string;

  @PasswordField()
  readonly password!: string;

  @StringField()
  readonly secret!: string;
}
