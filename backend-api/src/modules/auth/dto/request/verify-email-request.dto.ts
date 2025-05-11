import { StringField, StringFieldOptional } from '../../../../decorators';

export class VerifyEmailRequest {
  @StringField()
  readonly token!: string;

  @StringFieldOptional()
  lang?: string;
}
