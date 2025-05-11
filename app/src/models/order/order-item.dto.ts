import { AbstractDto } from '../commons/abstract.dto';
import { ProductTypeEnum } from '../product/product.dto';
import { OrderItemMetaData } from './order-item-metadata.dto';

export class OrderItemDto extends AbstractDto {
	orderId!: string;

	productId!: string;

	productName!: string;

	qty?: number;

	originPrice!: number;

	price!: number;

	discountAmount?: number;

	discountIds!: string[];

	total!: number;

	taxAmount?: number;

	productType?: ProductTypeEnum;

	data?: OrderItemMetaData;

	photo?: string;
}
