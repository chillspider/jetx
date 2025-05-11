import { EnumFieldOptional } from '../../../../decorators';
import { OrderTypeEnum } from '../../../order/enums/order-type.enum';

export class GetPaymentMethodRequest {
  @EnumFieldOptional(() => OrderTypeEnum)
  type?: OrderTypeEnum;
}
