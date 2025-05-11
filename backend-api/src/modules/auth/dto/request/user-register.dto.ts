import {
  EmailField,
  PasswordField,
  StringField,
  StringFieldOptional,
} from '../../../../decorators';

export class UserRegisterDto {
  @StringField()
  readonly firstName!: string;

  @StringField()
  readonly lastName!: string;

  @EmailField()
  readonly email!: string;

  @PasswordField({ minLength: 6 })
  readonly password!: string;

  @StringFieldOptional()
  readonly phone?: string;
}
