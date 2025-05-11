import { AutoMap } from '@automapper/classes';

import { StringFieldOptional } from '../../../../decorators';

export class UpdateB2bVoucherDto {
  @StringFieldOptional()
  @AutoMap()
  name?: string;

  @StringFieldOptional()
  @AutoMap()
  description?: string;

  @StringFieldOptional()
  @AutoMap()
  voucherName?: string;

  @StringFieldOptional()
  @AutoMap()
  voucherDescription?: string;
}
