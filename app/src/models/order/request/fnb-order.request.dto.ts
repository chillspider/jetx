/* eslint-disable max-classes-per-file */
export class FnbOrderItemRequest {
	id?: string;

	productId: string;

	qty: number;

	note?: string;

	originPrice: number;

	productName: string;

	price: number;

	total?: number;

	photo?: string;

	constructor(
		productId: string,
		qty: number,
		originPrice: number,
		productName: string,
		price: number,
		id?: string,
		note?: string,
		total?: number,
		photo?: string,
	) {
		this.productId = productId;
		this.qty = qty;
		this.originPrice = originPrice;
		this.productName = productName;
		this.price = price;
		this.id = id;
		this.note = note;
		this.total = total;
		this.photo = photo;
	}
}

export class FnbCreateOrderRequest {
	note?: string;

	shopId: string;

	orderItems: FnbOrderItemRequest[];

	parentId?: string;

	constructor(orderItems: FnbOrderItemRequest[], shopId: string, parentId?: string, note?: string) {
		this.orderItems = orderItems;
		this.shopId = shopId;
		this.parentId = parentId;
		this.note = note;
	}
}

export class FnbUpdateOrderRequest {
	orderId: string;

	shopId: string;

	orderItems: FnbOrderItemRequest[];

	constructor(orderId: string, shopId: string, orderItems: FnbOrderItemRequest[]) {
		this.orderId = orderId;
		this.shopId = shopId;
		this.orderItems = orderItems;
	}
}
