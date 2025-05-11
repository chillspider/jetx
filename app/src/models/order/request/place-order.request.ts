import { PaymentMethod, PaymentProvider } from '@/models/payment/payment-method.enum';

export class PlaceOrderRequest {
	deviceId!: string;

	modeId!: string;

	vehicleId?: string;

	discountIds?: string[];

	note?: string;

	paymentMethod!: PaymentMethod;

	paymentProvider?: PaymentProvider;

	isTokenize?: boolean;

	tokenId?: string;

	constructor(
		deviceId: string,
		modeId: string,
		paymentMethod: PaymentMethod,
		vehicleId?: string,
		paymentProvider?: PaymentProvider,
		isTokenize?: boolean,
		tokenId?: string,
		discountIds?: string[],
		note?: string,
	) {
		this.deviceId = deviceId;
		this.modeId = modeId;
		this.vehicleId = vehicleId;
		this.paymentMethod = paymentMethod;
		this.paymentProvider = paymentProvider;
		this.isTokenize = isTokenize;
		this.tokenId = tokenId;
		this.discountIds = discountIds;
		this.note = note;
	}
}
