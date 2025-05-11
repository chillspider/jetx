export class QRPaymentDto {
	result: boolean;
	orderId: string;
	endpoint?: string;
	expiredAt?: Date;
	qrCode?: string;
}
