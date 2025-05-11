import { AbstractDto } from '../commons/abstract.dto';

export class ProductDto extends AbstractDto {
	name!: string;

	description?: string;

	sku?: string;

	status!: ProductStatusEnum;

	type!: ProductTypeEnum;

	featureImageUrl?: string;

	categoryId?: string;
}

export enum ProductStatusEnum {
	VISIBLE = 'visible',
	UNAVAILABLE = 'unavailable',
	HIDDEN = 'hidden',
}

export enum ProductTypeEnum {
	WASHING = 'washing',
}
