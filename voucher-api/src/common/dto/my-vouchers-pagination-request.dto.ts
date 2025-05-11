import { BooleanFieldOptional, NumberFieldOptional } from '../../decorators';
import { PaginationRequestDto } from './pagination-request.dto';

export class MyVouchersPaginationRequestDto extends PaginationRequestDto {
  @NumberFieldOptional()
  orderValue?: number;

  @BooleanFieldOptional()
  isShowExpiredVouchers?: boolean;
}
