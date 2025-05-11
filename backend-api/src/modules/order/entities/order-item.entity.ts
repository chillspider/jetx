import { AutoMap } from '@automapper/classes';
import { Column, Entity } from 'typeorm';

import { AbstractEntity } from '../../../common/entities/abstract.entity';
import { ColumnNumericTransformer } from '../../../common/transformers/numeric';
import { ToInt } from '../../../decorators';
import { ProductTypeEnum } from '../../product/enums/products.enum';
import { OrderItemMetaData } from '../dtos/order-item-metadata.dto';

@Entity({ name: 'order_items', synchronize: false })
export class OrderItemEntity extends AbstractEntity {
  @Column({ type: 'uuid' })
  @AutoMap()
  orderId: string;

  @Column()
  @AutoMap()
  productId: string;

  @Column({ length: 200 })
  @AutoMap()
  productName: string;

  @Column({ nullable: true })
  @AutoMap()
  qty?: number;

  @Column({
    default: 0,
    type: 'numeric',
    transformer: new ColumnNumericTransformer(),
  })
  @ToInt()
  @AutoMap()
  originPrice: number;

  @Column({ type: 'numeric', transformer: new ColumnNumericTransformer() })
  @ToInt()
  @AutoMap()
  price: number;

  @Column({
    nullable: true,
    type: 'bigint',
    transformer: new ColumnNumericTransformer(),
  })
  @ToInt()
  @AutoMap()
  discountAmount?: number;

  @Column({ type: 'jsonb', default: [] })
  @AutoMap(() => [String])
  discountIds?: string[];

  @Column({ type: 'numeric', transformer: new ColumnNumericTransformer() })
  @ToInt()
  @AutoMap()
  total: number;

  @Column({
    type: 'numeric',
    nullable: true,
    transformer: new ColumnNumericTransformer(),
  })
  @ToInt()
  @AutoMap()
  taxAmount?: number;

  @Column({ default: ProductTypeEnum.WASHING, nullable: true })
  @AutoMap()
  productType?: ProductTypeEnum;

  @Column({ type: 'jsonb', default: {}, nullable: true })
  @AutoMap(() => OrderItemMetaData)
  data?: OrderItemMetaData;

  @Column({ nullable: true })
  @AutoMap()
  nflowId?: string;
}
