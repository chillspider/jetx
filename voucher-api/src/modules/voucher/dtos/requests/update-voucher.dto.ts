import { AutoMap } from '@automapper/classes';

import { UUIDField } from '../../../../decorators';
import { CreateVoucherDto } from './create-voucher.dto';

export class UpdateVoucherDto extends CreateVoucherDto {
  @UUIDField()
  @AutoMap()
  id!: string;
}
