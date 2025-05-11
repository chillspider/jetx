import { AutoMap } from '@automapper/classes';

import {
  EnumField,
  StringField,
  StringFieldOptional,
} from '../../../../decorators';
import { ProductStatusEnum, ProductTypeEnum } from '../../enums/products.enum';

export class CreateProductDto {
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
  @AutoMap(() => String)
  categoryId?: string;

  @StringFieldOptional({ nullable: true })
  @AutoMap()
  featureImageUrl?: string;
}

export class UpdateProductDto extends CreateProductDto {
  @StringField()
  @AutoMap()
  id!: string;
}
