import { AutoMap } from '@automapper/classes';

import { OrderItemMetaData } from '../../order/dtos/order-item-metadata.dto';
import { ProductTypeEnum } from '../../product/enums/products.enum';

export class SyncOrderItemDto {
  @AutoMap()
  id: string;

  @AutoMap()
  orderId: string;

  @AutoMap()
  productId: string;

  @AutoMap()
  productName: string;

  @AutoMap()
  qty?: number;

  @AutoMap()
  originPrice: number;

  @AutoMap()
  price: number;

  @AutoMap()
  discountAmount?: number;

  @AutoMap(() => [String])
  discountIds: string[];

  @AutoMap()
  total: number;

  @AutoMap()
  taxAmount?: number;

  @AutoMap()
  productType?: ProductTypeEnum;

  @AutoMap(() => OrderItemMetaData)
  data?: OrderItemMetaData;
}
