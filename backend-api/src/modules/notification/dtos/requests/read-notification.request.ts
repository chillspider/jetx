import { BooleanField } from '../../../../decorators';

export class ReadNotificationRequest {
  @BooleanField()
  isRead: boolean;
}
