/* eslint-disable max-classes-per-file */
import { BBDiscountActionEnum, BBItemVisibilityEnum, BBProductTypeEnum } from './enums/bb.enum';

export class BBProductSizeDto {
	id!: string;
}

export class BBProductOptionTypeDto {
	id!: string;
}

export class BBLinkedProductGroupDto {
	id!: string;
}

export class BBProductDiscountDto {
	id!: string;

	price!: number;

	isExpired?: boolean;

	priority!: number;

	discountAction!: BBDiscountActionEnum;
}

export class BBProductDto {
	id!: string;

	name!: string;

	price: number;

	visibility!: BBItemVisibilityEnum;

	photo?: string;

	description?: string;

	tax?: number;

	hasAppliedTopping!: boolean;

	discount!: BBProductDiscountDto;

	skuCode?: string;

	type?: BBProductTypeEnum;

	categoryId?: string;

	isCreateQuickly?: boolean;

	isExpired?: boolean;

	discounts?: BBProductDiscountDto[];

	discountPrice?: number;

	quantity?: number;

	constructor(
		id: string,
		name: string,
		price: number,
		visibility: BBItemVisibilityEnum,
		photo: string,
		hasAppliedTopping: boolean,
		discount: BBProductDiscountDto,
		skuCode?: string,
		type?: BBProductTypeEnum,
		categoryId?: string,
		isCreateQuickly?: boolean,
		isExpired?: boolean,
		discounts?: BBProductDiscountDto[],
		description?: string,
		tax?: number,
	) {
		this.id = id;
		this.name = name;
		this.price = price;
		this.visibility = visibility;
		this.photo = photo;
		this.description = description;
		this.tax = tax;
		this.hasAppliedTopping = hasAppliedTopping;
		this.discount = discount;
		this.skuCode = skuCode;
		this.type = type;
		this.categoryId = categoryId;
		this.isCreateQuickly = isCreateQuickly;
		this.isExpired = isExpired;
		this.discounts = discounts;
	}
}
