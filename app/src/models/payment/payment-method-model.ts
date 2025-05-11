import { PaymentMethod, PaymentProvider } from './payment-method.enum';
import { UserTokenDto } from './user-token.dto';

export class PaymentMethodModel {
	method!: PaymentMethod;

	provider?: PaymentProvider;

	token?: UserTokenDto;

	isDefault?: boolean;
}
