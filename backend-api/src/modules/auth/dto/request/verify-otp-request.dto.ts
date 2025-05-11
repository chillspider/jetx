import { EmailField, StringField } from '../../../../decorators';

export class VerifyOtpRequest {
  @EmailField()
  readonly email!: string;

  @StringField()
  readonly otp!: string;
}
