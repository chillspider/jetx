import { PaymentProvider } from './payment-method.enum';

export class UserTokenDto {
	id!: string;

	accountBrand?: string;

	accountSource?: string;

	accountNumber?: string;

	accountName?: string;

	token!: string;

	paymentProvider!: PaymentProvider;

	isDefault?: boolean;
}
