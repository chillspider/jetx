import { AutoMap } from '@automapper/classes';

import { ClassField, EnumFieldOptional } from '../../../decorators';
import { WashMode } from '../enums/wash-mode.enum';
import { EventValidityDto } from './event-validity.dto';

export class VoucherValidityDto {
  @ClassField(() => EventValidityDto, { isArray: true, each: true })
  @AutoMap(() => [EventValidityDto])
  excludeTimes?: EventValidityDto[];

  @EnumFieldOptional(() => WashMode, { isArray: true, each: true })
  washModes?: WashMode[];
}
