import { AbstractDto } from "./abstract.dto";

export enum DeviceStatusEnum {
	AVAILABLE = "available",
	UNAVAILABLE = "unavailable",
	PROCESSING = "processing",
}

export enum ProductStatusEnum {
	VISIBLE = "visible",
	UNAVAILABLE = "unavailable",
	HIDDEN = "hidden",
}

export enum ProductTypeEnum {
	WASHING = "washing",
	FNB = "fnb",
	PACKAGE = "package",
}

export class ProductDto extends AbstractDto {
	name!: string;
	description?: string;
	sku?: string;
	status!: ProductStatusEnum;
	type!: ProductTypeEnum;
	featureImageUrl?: string;
	categoryId?: string;
}

export class AttentionDto {
	id!: string;
	name!: string;
	featureImageUrl?: string;
}

export class ModeMetadata {
	duration?: number;
}

export class ModeDto {
	id: string;
	name!: string;
	description?: string;
	code!: string;
	metadata?: ModeMetadata;
	productId!: string;
	price: number;
	originPrice: number;
}

export class DeviceDto extends AbstractDto {
	name!: string;
	status!: DeviceStatusEnum;
	stationId!: string;
	productId!: string;
	deviceNo!: string;
	product!: ProductDto;
	attentions?: AttentionDto[];
	modes?: ModeDto[];
}
