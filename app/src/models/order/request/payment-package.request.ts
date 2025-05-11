import { PaymentMethod, PaymentProvider } from '@/models/payment/payment-method.enum';

export class PaymentPackageRequest {
	packageId!: string;

	paymentMethod!: PaymentMethod;

	paymentProvider?: PaymentProvider;

	isTokenize?: boolean;

	tokenId?: string;

	note?: string;

	constructor(
		packageId: string,
		paymentMethod: PaymentMethod,
		paymentProvider?: PaymentProvider,
		isTokenize?: boolean,
		tokenId?: string,
		note?: string,
	) {
		this.packageId = packageId;
		this.paymentMethod = paymentMethod;
		this.paymentProvider = paymentProvider;
		this.isTokenize = isTokenize;
		this.tokenId = tokenId;
		this.note = note;
	}
}
