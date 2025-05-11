import { AutoMap } from '@automapper/classes';

import { BooleanField, StringField } from '../../../decorators';

export class VoucherLocationDto {
  @StringField({ isArray: true, each: true, nullable: true })
  @AutoMap(() => [String])
  stationIds: string[] = [];

  @StringField({ isArray: true, each: true, nullable: true })
  @AutoMap(() => [String])
  deviceIds: string[] = [];

  @BooleanField()
  @AutoMap()
  isExcluded: boolean = false;
}
