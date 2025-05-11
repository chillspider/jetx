import { BooleanFieldOptional, StringFieldOptional } from '../../../decorators';

export class VoucherExcludedReasonDto {
  @StringFieldOptional()
  reason: string;

  @BooleanFieldOptional()
  isExcluded: boolean;
}
