import { AutoMap } from '@automapper/classes';

import { AbstractDto } from '../../../common/dto/abstract.dto';
import { ProductTypeEnum } from '../../product/enums/products.enum';
import { OrderItemMetaData } from './order-item-metadata.dto';

export class OrderItemDto extends AbstractDto {
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

  @AutoMap()
  photo?: string;
}
