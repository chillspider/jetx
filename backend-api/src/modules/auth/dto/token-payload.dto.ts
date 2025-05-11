import { NumberFieldOptional, StringField } from '../../../decorators';

export class TokenPayloadDto {
  @NumberFieldOptional()
  expiresIn?: number;

  @StringField()
  accessToken: string;

  constructor(data: { expiresIn?: number; accessToken: string }) {
    this.expiresIn = data.expiresIn;
    this.accessToken = data.accessToken;
  }
}
