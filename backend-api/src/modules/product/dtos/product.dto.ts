import { AutoMap } from '@automapper/classes';

import { AbstractDto } from '../../../common/dto/abstract.dto';
import {
  EnumField,
  StringField,
  StringFieldOptional,
} from '../../../decorators';
import { ProductStatusEnum, ProductTypeEnum } from '../enums/products.enum';

export class ProductDto extends AbstractDto {
  @StringField()
  @AutoMap()
  name!: string;

  @StringFieldOptional({ nullable: true })
  @AutoMap()
  description?: string;

  @StringFieldOptional({ nullable: true })
  @AutoMap()
  sku?: string;

  @EnumField(() => ProductStatusEnum)
  @AutoMap()
  status!: ProductStatusEnum;

  @EnumField(() => ProductTypeEnum)
  @AutoMap()
  type!: ProductTypeEnum;

  @StringFieldOptional({ nullable: true })
  @AutoMap()
  featureImageUrl?: string;

  @StringFieldOptional({ nullable: true })
  @AutoMap(() => String)
  categoryId?: string;
}
