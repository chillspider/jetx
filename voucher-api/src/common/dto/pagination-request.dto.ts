import { DEFAULT_PAGE_SIZE, Order } from '../../constants';
import {
  BooleanFieldOptional,
  EnumFieldOptional,
  NumberFieldOptional,
  StringFieldOptional,
} from '../../decorators';

export class PaginationRequestDto {
  @NumberFieldOptional({
    minimum: 1,
    default: 1,
    int: true,
  })
  readonly pageIndex: number = 1;

  @NumberFieldOptional({
    minimum: 1,
    maximum: 100,
    default: DEFAULT_PAGE_SIZE,
    int: true,
  })
  readonly pageSize: number = DEFAULT_PAGE_SIZE;

  @EnumFieldOptional(() => Order, {
    default: Order.ASC,
  })
  readonly order: Order = Order.ASC;

  @StringFieldOptional()
  readonly q?: string;

  @BooleanFieldOptional()
  readonly takeAll?: boolean;

  get skip(): number {
    return (this.pageIndex - 1) * this.pageSize;
  }
}
