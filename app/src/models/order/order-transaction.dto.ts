/* eslint-disable @typescript-eslint/no-redundant-type-constituents */
import { AbstractDto } from '../commons/abstract.dto';
import { PaymentMethod, PaymentProvider } from '../payment/payment-method.enum';
import { TransactionStatus } from './transaction-status.enum';

export class OrderTransactionDto extends AbstractDto {
	orderId!: string;

	transactionId!: string;

	status!: TransactionStatus;

	amount!: number;

	paymentMethod?: PaymentMethod;

	paymentProvider?: PaymentProvider;

	data?: Record<string, string | Date | any>;

	incrementId!: number;
}
