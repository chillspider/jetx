export enum BBApplicationCodeEnum {
	WL = 'WL',
	POS = 'POS',
	GIFT_CARD = 'GIFT_CARD',
	INVENTORY = 'INVENTORY',
	CRM = 'CRM',
}

export enum BBCategoryVisibilityEnum {
	VISIBLE = 'visible',
	HIDDEN = 'hidden',
	UNAVAILABLE = 'unavailable',
}

export enum BBCategoryTypeEnum {
	DEFAULT = 'default',
	GROUP = 'group',
}

export enum BBItemVisibilityEnum {
	VISIBLE = 'visible',
	HIDDEN = 'hidden',
	UNAVAILABLE = 'unavailable',
}

export enum BBDiscountRuleEnum {
	CART = 'cart',
	PRODUCTS = 'product',
	CATEGORY = 'category',
	KIOSK = 'kiosk',
	COUPON = 'coupon',
}

export enum BBDiscountActionEnum {
	FIXED_PRICE = 'fixed_price',
	FIXED_AMOUNT = 'fixed_amount',
	FIXED_PERCENT = 'fixed_percent',
}

export enum BBOrderItemTypeEnum {
	PRODUCT = 'product',
	GIFT_CARD = 'gift_card',
	BUNDLE = 'bundle',
	BILLABLE = 'billable',
}

export enum BBProductTypeEnum {
	PRODUCT = 'product',
	GIFT_CARD = 'gift_card',
	BUNDLE = 'bundle',
	SIMPLE = 'simple',
	BILLABLE = 'billable',
	CONFIGURABLE = 'configurable',
	ADD_ON = 'add_on',
}

export enum BBOrderStatusEnum {
	COMPLETED = 'completed',
	DRAFT = 'draft',
	WAITING = 'waiting',
	CONFIRM = 'confirm',
	REJECT = 'reject',
	PROCESSING = 'processing',
	CANCELED = 'canceled',
	FAILED = 'failed',
	REFUNDED = 'refunded',
}
