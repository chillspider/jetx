import { StringField } from '../../../../decorators';

export class NflowTokenRequestDto {
  @StringField()
  username: string;

  @StringField()
  password: string;
}
