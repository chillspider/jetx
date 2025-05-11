import { AutoMap } from '@automapper/classes';

import { SupportStatus } from '../../support/enums/support-status.enum';

export class SyncSupportDto {
  @AutoMap()
  /// customerId
  userId?: string;

  @AutoMap()
  /// customerEmail
  email?: string;

  @AutoMap()
  /// customerName
  name?: string;

  @AutoMap()
  /// customerPhone
  phone?: string;

  @AutoMap()
  orderId?: string;

  @AutoMap()
  /// content
  requestDetail?: string;

  @AutoMap()
  images?: Array<{
    url: string;
  }>;

  @AutoMap()
  status: SupportStatus;

  @AutoMap()
  title?: string;
}
