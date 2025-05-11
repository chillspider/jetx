export class BBGetPublicProducts {
	categoryId?: string;

	filter?: string;

	shopId: string;

	constructor(shopId: string, categoryId?: string, filter?: string) {
		this.categoryId = categoryId;
		this.filter = filter;
		this.shopId = shopId;
	}
}
