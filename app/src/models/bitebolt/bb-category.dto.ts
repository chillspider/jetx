/* eslint-disable max-classes-per-file */
import { BBProductDto } from './bb-product.dto';
import { BBCategoryTypeEnum, BBCategoryVisibilityEnum } from './enums/bb.enum';

export class BBCategoryDto {
	id!: string;

	name!: string;

	visibility!: BBCategoryVisibilityEnum;

	itemIds!: string[];

	priority!: number;

	type?: BBCategoryTypeEnum;
}

export class BBCategoryProductDto {
	categoryId!: string;

	visibility!: BBCategoryVisibilityEnum;

	categoryName!: string;

	products!: BBProductDto[];
}
