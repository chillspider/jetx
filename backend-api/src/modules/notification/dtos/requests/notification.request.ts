import { StringField } from '../../../../decorators';

export class NotificationRequestDto {
  @StringField()
  title: string;

  @StringField()
  message: string;
}
