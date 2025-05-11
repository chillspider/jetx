// eslint-disable-next-line simple-import-sort/imports
import { ResponseDto } from '@/models/commons/response.dto';

import { PaginationRequestDto } from '@/models/commons/pagination-request.dto';
import { PaginationResponseDto } from '@/models/commons/pagination-response.dto';
import { OrderDto } from '@/models/order/order.dto';
import {
	CreateOrderRequest,
	UpdateOrderRequest,
} from '@/models/order/request/create-order.request';
import { OperationOrderDeviceRequest } from '@/models/order/request/operation-order-device.request';
import { PaymentOrderRequest } from '@/models/order/request/payment-order.request';
import { PaymentPackageRequest } from '@/models/order/request/payment-package.request';
import { PaymentOrderResponse } from '@/models/order/response/payment-order.response.dto';
import BaseApi from '../base-api';
import httpClient from '../http-client';

class OrderApi extends BaseApi {
	constructor() {
		super(httpClient);
	}

	private readonly ENDPOINT = '/api/v1/orders';

	async placeOrder(request: CreateOrderRequest): Promise<ResponseDto<OrderDto>> {
		return this.post<ResponseDto<OrderDto>>(`${this.ENDPOINT}`, request);
	}

	async updateOrder(request: UpdateOrderRequest): Promise<ResponseDto<OrderDto>> {
		return this.put<ResponseDto<OrderDto>>(`${this.ENDPOINT}`, request);
	}

	async paymentOrder(request: PaymentOrderRequest): Promise<ResponseDto<PaymentOrderResponse>> {
		return this.post(`${this.ENDPOINT}/payment`, request);
	}

	async paymentPackage(request: PaymentPackageRequest): Promise<ResponseDto<PaymentOrderResponse>> {
		return this.post(`${this.ENDPOINT}/payment/package`, request);
	}

	async getOrdersHistory(
		query: PaginationRequestDto,
	): Promise<ResponseDto<PaginationResponseDto<OrderDto>>> {
		return this.get(`${this.ENDPOINT}/history`, query);
	}

	async getOrder(id: string): Promise<ResponseDto<OrderDto>> {
		return this.get(`${this.ENDPOINT}/${id}`);
	}

	async checkOrderStatus(id: string): Promise<ResponseDto<boolean>> {
		return this.get<ResponseDto<boolean>>(`${this.ENDPOINT}/check/${id}`);
	}

	async operationOrderDevice(request: OperationOrderDeviceRequest): Promise<ResponseDto<boolean>> {
		return this.post<ResponseDto<boolean>>(`${this.ENDPOINT}/operation`, request);
	}

	async checkPayment(id: string): Promise<ResponseDto<boolean>> {
		return this.get<ResponseDto<boolean>>(`${this.ENDPOINT}/check-payment/${id}`);
	}

	async cancelPaymentOrder(id: string): Promise<ResponseDto<boolean>> {
		return this.put<ResponseDto<boolean>>(`${this.ENDPOINT}/payment/cancel/${id}`, {});
	}
}

const orderApi = new OrderApi();

export default orderApi;
