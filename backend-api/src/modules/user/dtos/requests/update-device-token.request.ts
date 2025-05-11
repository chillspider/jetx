import { StringField } from '../../../../decorators';

export class UpdateDeviceTokenRequest {
  @StringField()
  token: string;
}
