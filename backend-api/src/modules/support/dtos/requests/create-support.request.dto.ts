import { AutoMap } from '@automapper/classes';

import {
  EmailField,
  StringFieldOptional,
  UUIDFieldOptional,
} from '../../../../decorators';

export class CreateSupportRequestDto {
  @EmailField()
  @AutoMap()
  customerEmail: string;

  @StringFieldOptional()
  @AutoMap()
  customerName?: string;

  @StringFieldOptional()
  @AutoMap()
  customerPhone?: string;

  @UUIDFieldOptional()
  @AutoMap()
  orderId?: string;

  @StringFieldOptional({ maxLength: 200 })
  @AutoMap()
  title?: string;

  @StringFieldOptional({ maxLength: 500 })
  @AutoMap()
  content?: string;
}
