import { EmailField } from '../../../../decorators';

export class ForgotPasswordRequestDto {
  @EmailField()
  readonly email!: string;
}
