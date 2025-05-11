import { PaymentMethod, PaymentProvider } from '@/models/payment/payment-method.enum';

export class PaymentOrderRequest {
	orderId!: string;

	paymentMethod!: PaymentMethod;

	paymentProvider?: PaymentProvider;

	isTokenize?: boolean;

	tokenId?: string;

	constructor(
		orderId: string,
		paymentMethod: PaymentMethod,
		paymentProvider?: PaymentProvider,
		isTokenize?: boolean,
		tokenId?: string,
	) {
		this.orderId = orderId;
		this.paymentMethod = paymentMethod;
		this.paymentProvider = paymentProvider;
		this.isTokenize = isTokenize;
		this.tokenId = tokenId;
	}
}
