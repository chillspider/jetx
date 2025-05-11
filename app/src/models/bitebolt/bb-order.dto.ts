/* eslint-disable max-classes-per-file */
import { AbstractDto } from '../commons/abstract.dto';
import { BBOrderStatusEnum } from './enums/bb.enum';

export class BBOrderItemDto extends AbstractDto {
	productId!: string;

	productName!: string;

	qty!: number;

	price!: number;

	total!: number;

	taxAmount?: number;

	discountAmount?: number;

	note?: string;

	discountIds!: string[];

	productType?: string;

	originPrice!: number;
}

export class BBOrderDto extends AbstractDto {
	customerName?: string;

	customerEmail?: string;

	customerPhone?: string;

	note?: string;

	subTotal!: number;

	grandTotal!: number;

	taxAmount!: number;

	status!: BBOrderStatusEnum;

	extraFee?: number;

	itemQuantity!: number;

	toGo?: boolean;

	incrementId!: number;

	paymentMethod!: string;

	discountAmount?: number;

	discountIds!: string[];

	orderItemType!: string;

	shopId?: string;

	tipAmount?: number;

	orderItems?: BBOrderItemDto[];
}
