import { AutoMap } from '@automapper/classes';

import {
  ClassFieldOptional,
  EmailField,
  EnumField,
  StringField,
  StringFieldOptional,
} from '../../../decorators';
import { SupportStatus } from '../enums/support-status.enum';
import { SupportDataDto } from './support-data.dto';

export class SupportDto {
  @StringField()
  @AutoMap()
  id: string;

  @StringFieldOptional()
  @AutoMap()
  customerId?: string;

  @EmailField()
  @AutoMap()
  customerEmail: string;

  @StringFieldOptional()
  @AutoMap()
  customerName?: string;

  @StringFieldOptional()
  @AutoMap()
  customerPhone?: string;

  @StringFieldOptional()
  @AutoMap()
  orderId?: string;

  @StringFieldOptional()
  @AutoMap()
  title?: string;

  @StringFieldOptional()
  @AutoMap()
  content?: string;

  @StringFieldOptional({ isArray: true, each: true })
  @AutoMap(() => [String])
  images?: string[];

  @EnumField(() => SupportStatus)
  @AutoMap()
  status: SupportStatus;

  @ClassFieldOptional(() => SupportDataDto)
  @AutoMap(() => SupportDataDto)
  data?: SupportDataDto;

  @StringFieldOptional()
  @AutoMap()
  nflowId?: string;
}
