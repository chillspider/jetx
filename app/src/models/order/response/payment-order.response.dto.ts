export class PaymentOrderResponse {
	result!: boolean;

	orderId!: string;

	endpoint?: string;

	expiredAt?: Date;

	expiredInSec?: number;

	qrCode?: string;
}
