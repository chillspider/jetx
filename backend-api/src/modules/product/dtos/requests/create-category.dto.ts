import { AutoMap } from '@automapper/classes';

import {
  EnumField,
  NumberField,
  StringField,
  StringFieldOptional,
} from '../../../../decorators';
import { CategoryStatusEnum } from '../../enums/categories.enum';

export class CreateCategoryDto {
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

  @StringFieldOptional({ isArray: true, each: true })
  productIds?: string[];
}

export class UpdateCategoryDto extends CreateCategoryDto {
  @StringField()
  @AutoMap()
  id!: string;
}
