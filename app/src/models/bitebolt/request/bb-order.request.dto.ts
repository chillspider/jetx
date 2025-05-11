/* eslint-disable max-classes-per-file */
import { BBOrderItemTypeEnum } from '../enums/bb.enum';

export class BBOrderItemRequest {
	id?: string;

	productId: string;

	qty: number;

	originPrice: number;

	productName: string;

	price: number;

	total?: number;

	discountIds: string[] = [];

	constructor(
		productId: string,
		qty: number,
		originPrice: number,
		productName: string,
		price: number,
		id?: string,
		total?: number,
		discountIds: string[] = [],
	) {
		this.productId = productId;
		this.qty = qty;
		this.originPrice = originPrice;
		this.productName = productName;
		this.price = price;
		this.id = id;
		this.total = total;
		this.discountIds = discountIds;
	}
}

export class BBCreateOrderRequest {
	note?: string;

	shopId: string;

	toGo: boolean;

	customerName?: string;

	customerPhone?: string;

	orderItems: BBOrderItemRequest[];

	orderItemType: BBOrderItemTypeEnum;

	constructor(
		orderItems: BBOrderItemRequest[],
		orderItemType: BBOrderItemTypeEnum,
		shopId: string,
		toGo: boolean,
		note?: string,
		customerName?: string,
		customerPhone?: string,
	) {
		this.orderItems = orderItems;
		this.orderItemType = orderItemType;
		this.note = note;
		this.shopId = shopId;
		this.toGo = toGo;
		this.customerName = customerName;
		this.customerPhone = customerPhone;
	}
}

export class BBPaymentOrderRequest {
	orderId: string;

	paymentMethod?: string = 'cash';

	note?: string;

	shopId?: string;

	constructor(orderId: string, paymentMethod?: string, note?: string, shopId?: string) {
		this.orderId = orderId;
		this.paymentMethod = paymentMethod;
		this.note = note;
		this.shopId = shopId;
	}
}

export class BBUpdateOrderItemsRequest {
	shopId: string;

	orderId: string;

	orderItems: BBOrderItemRequest[];

	orderItemType: BBOrderItemTypeEnum;

	constructor(
		orderItems: BBOrderItemRequest[],
		orderItemType: BBOrderItemTypeEnum,
		shopId: string,
		orderId: string,
	) {
		this.orderItems = orderItems;
		this.orderItemType = orderItemType;
		this.shopId = shopId;
		this.orderId = orderId;
	}
}
