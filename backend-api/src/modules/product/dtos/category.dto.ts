import { AutoMap } from '@automapper/classes';

import { AbstractDto } from '../../../common/dto/abstract.dto';
import {
  ClassField,
  EnumField,
  NumberField,
  StringField,
  StringFieldOptional,
} from '../../../decorators';
import { CategoryStatusEnum } from '../enums/categories.enum';
import { ProductDto } from './product.dto';

export class CategoryDto extends AbstractDto {
  @StringField()
  @AutoMap()
  name!: string;

  @StringFieldOptional({ nullable: true })
  @AutoMap()
  description?: string;

  @EnumField(() => CategoryStatusEnum)
  @AutoMap()
  status!: CategoryStatusEnum;

  @NumberField()
  @AutoMap()
  priority!: number;

  @ClassField(() => ProductDto, { isArray: true })
  @AutoMap(() => [ProductDto])
  products?: ProductDto[];
}
