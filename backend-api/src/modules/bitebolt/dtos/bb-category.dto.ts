import {
  ClassField,
  EnumField,
  EnumFieldOptional,
  NumberField,
  StringField,
} from '../../../decorators';
import { BBCategoryTypeEnum, BBCategoryVisibilityEnum } from '../enums/bb.enum';
import { BBProductDto } from './bb-product.dto';

export class BBCategoryDto {
  @StringField()
  id: string;

  @StringField()
  name: string;

  @StringField()
  visibility: BBCategoryVisibilityEnum;

  @StringField({ isArray: true })
  itemIds: string[];

  @NumberField()
  priority: number;

  @EnumFieldOptional(() => BBCategoryTypeEnum)
  type?: BBCategoryTypeEnum;
}

export class BBCategoryProductDto {
  @StringField()
  categoryId: string;

  @EnumField(() => BBCategoryVisibilityEnum)
  visibility: BBCategoryVisibilityEnum;

  @StringField()
  categoryName: string;

  @ClassField(() => BBProductDto, { isArray: true })
  products: BBProductDto[];
}
