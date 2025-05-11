import { BBCategoryDto } from '@/models/bitebolt/bb-category.dto';
import { BBGeneralSettingDto } from '@/models/bitebolt/bb-general-setting.dto';
import { BBProductDto } from '@/models/bitebolt/bb-product.dto';
import { BBGetPublicProducts } from '@/models/bitebolt/request/bb-get-product.request.dto';
import { BBUpdateOrderItemsRequest } from '@/models/bitebolt/request/bb-order.request.dto';
import { ResponseDto } from '@/models/commons/response.dto';
import { OrderDto } from '@/models/order/order.dto';
import { FnbCreateOrderRequest } from '@/models/order/request/fnb-order.request.dto';
import { PaymentOrderRequest } from '@/models/order/request/payment-order.request';
import { PaymentOrderResponse } from '@/models/order/response/payment-order.response.dto';

import BaseApi from '../base-api';
import httpClient from '../http-client';

class BiteBoltApi extends BaseApi {
	constructor() {
		super(httpClient);
	}

	private readonly ENDPOINT = '/api/v1/fnb';
	private readonly FNB_ORDER = '/api/v1/fnb-order';

	async getGeneralSetting(): Promise<ResponseDto<BBGeneralSettingDto>> {
		return this.get(`${this.ENDPOINT}/general-setting`);
	}

	async getCategories(shopId: string): Promise<ResponseDto<BBCategoryDto[]>> {
		return this.get(`${this.ENDPOINT}/categories`, { shopId });
	}

	async getProducts(request: BBGetPublicProducts): Promise<ResponseDto<BBProductDto[]>> {
		return this.get(`${this.ENDPOINT}/products`, request);
	}

	async createOrder(request: FnbCreateOrderRequest): Promise<ResponseDto<OrderDto>> {
		return this.post(`${this.FNB_ORDER}`, request);
	}

	async updateOrder(request: BBUpdateOrderItemsRequest): Promise<ResponseDto<OrderDto>> {
		return this.put(`${this.FNB_ORDER}`, request);
	}

	async paymentOrder(request: PaymentOrderRequest): Promise<ResponseDto<PaymentOrderResponse>> {
		return this.post(`${this.FNB_ORDER}/payment`, request);
	}
}

const biteboltApi = new BiteBoltApi();

export default biteboltApi;
