import {
  BBS3UrlParser,
  BooleanField,
  BooleanFieldOptional,
  ClassFieldOptional,
  EnumField,
  EnumFieldOptional,
  NumberField,
  NumberFieldOptional,
  StringField,
  StringFieldOptional,
} from '../../../decorators';
import { FnbPriceConverter } from '../../../decorators/fnb-price.decorator';
import {
  BBDiscountActionEnum,
  BBItemVisibilityEnum,
  BBProductTypeEnum,
} from '../enums/bb.enum';

export class BBProductSizeDto {
  id: string;
}

export class BBProductOptionTypeDto {
  id: string;
}

export class BBLinkedProductGroupDto {
  id: string;
}

export class BBProductDiscountDto {
  @StringField()
  id: string;

  @NumberField()
  @FnbPriceConverter()
  price: number;

  @BooleanFieldOptional()
  isExpired?: boolean;

  @NumberField()
  priority: number;

  @EnumField(() => BBDiscountActionEnum)
  discountAction: BBDiscountActionEnum;
}

export class BBProductDto {
  @StringField()
  id: string;

  @StringField()
  name: string;

  @NumberField()
  @FnbPriceConverter()
  price?: number;

  @EnumField(() => BBItemVisibilityEnum)
  visibility: BBItemVisibilityEnum;

  @StringFieldOptional()
  @BBS3UrlParser()
  photo?: string;

  @StringFieldOptional()
  description?: string;

  @BooleanField()
  takeawayAllowance: boolean;

  @BooleanField()
  isTopping: boolean;

  @NumberField()
  tax?: number;

  @ClassFieldOptional(() => BBProductSizeDto, { isArray: true })
  productSizes?: BBProductSizeDto[];

  @StringFieldOptional()
  @BBS3UrlParser()
  thumbnail?: string;

  @ClassFieldOptional(() => BBProductOptionTypeDto, { isArray: true })
  productOptionTypes?: BBProductOptionTypeDto[];

  @BooleanFieldOptional()
  applyToppingBySize?: boolean;

  @ClassFieldOptional(() => BBLinkedProductGroupDto, { isArray: true })
  linkedProductGroups?: BBLinkedProductGroupDto[];

  @BooleanFieldOptional()
  isDefaultTax: boolean;

  @BooleanFieldOptional()
  hasAppliedTopping?: boolean;

  @ClassFieldOptional(() => BBProductDiscountDto)
  discount: BBProductDiscountDto;

  @StringFieldOptional()
  skuCode?: string;

  @BooleanFieldOptional()
  isInventoryTracking?: boolean;

  @BooleanFieldOptional()
  isInventoryAllowOutOfStockCounting?: boolean;

  @BooleanFieldOptional()
  isManageByIngredient: boolean;

  @EnumFieldOptional(() => BBProductTypeEnum)
  type?: BBProductTypeEnum;

  @StringFieldOptional()
  categoryId?: string;

  @BooleanFieldOptional()
  isCreateQuickly?: boolean;

  @BooleanFieldOptional()
  isExpired?: boolean;

  @ClassFieldOptional(() => BBProductDiscountDto, { isArray: true })
  discounts?: BBProductDiscountDto[];

  @NumberFieldOptional()
  @FnbPriceConverter()
  discountPrice?: number;
}
