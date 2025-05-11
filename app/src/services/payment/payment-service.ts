// eslint-disable-next-line simple-import-sort/imports
import { ResponseDto } from '@/models/commons/response.dto';

import { PaymentMethodModel } from '@/models/payment/payment-method-model';
import BaseApi from '../base-api';
import httpClient from '../http-client';

class PaymentApi extends BaseApi {
	constructor() {
		super(httpClient);
	}

	private readonly ENDPOINT = '/api/v1/payments';

	async getPaymentMethods(type: string): Promise<ResponseDto<PaymentMethodModel[]>> {
		return this.get<ResponseDto<PaymentMethodModel[]>>(`${this.ENDPOINT}/methods`, {
			type,
		});
	}
}

const paymentApi = new PaymentApi();

export default paymentApi;
