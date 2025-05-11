import { AbstractDto } from '../commons/abstract.dto';
import { OrderMembershipDto } from '../membership/order-membership.dto';
import { PaymentMethod, PaymentProvider } from '../payment/payment-method.enum';
import { OrderItemDto } from './order-item.dto';
import { OrderStatusEnum } from './order-status.enum';
import { OrderTransactionDto } from './order-transaction.dto';
import { OrderVoucherDto } from './order-voucher.dto';
import { OrderMetaData } from './response/order-metadata.dto';

export enum OrderTypeEnum {
	/// Washing order
	DEFAULT = 'default',
	/// Add card token
	TOKENIZE = 'tokenize',
	/// Package order
	PACKAGE = 'package',
}

export class OrderDto extends AbstractDto {
	incrementId!: number;

	customerId?: string;

	customerName?: string;

	customerEmail?: string;

	customerPhone?: string;

	note?: string;

	subTotal?: number;

	grandTotal!: number;

	itemQuantity!: number;

	discountAmount!: number;

	taxAmount?: number;

	extraFee?: number;

	status!: OrderStatusEnum;

	paymentMethod!: PaymentMethod;

	paymentProvider!: PaymentProvider;

	data?: OrderMetaData;

	orderItems!: OrderItemDto[];

	orderTransactions!: OrderTransactionDto[];

	discountIds?: string[];

	discounts?: OrderVoucherDto[];

	membershipAmount?: number;

	membership?: OrderMembershipDto;

	type?: OrderTypeEnum;

	fnbOrderId?: string;
}
