import { AxiosError } from 'axios';
import { createMutation } from 'react-query-kit';

import { OrderDto } from '@/models/order/order.dto';
import {
	CreateOrderRequest,
	UpdateOrderRequest,
} from '@/models/order/request/create-order.request';
import { PaymentOrderRequest } from '@/models/order/request/payment-order.request';
import { PaymentPackageRequest } from '@/models/order/request/payment-package.request';
import { PaymentOrderResponse } from '@/models/order/response/payment-order.response.dto';
import orderApi from '@/services/order/order-service';

export const usePlaceOrder = createMutation<OrderDto, CreateOrderRequest, AxiosError>({
	mutationKey: ['place-order'],
	mutationFn: async variables => {
		const res = await orderApi.placeOrder(variables);
		return res.data;
	},
});

export const useUpdateOrder = createMutation<OrderDto, UpdateOrderRequest, AxiosError>({
	mutationKey: ['update-order'],
	mutationFn: async variables => {
		const res = await orderApi.updateOrder(variables);
		return res.data;
	},
});

export const usePaymentOrder = createMutation<
	PaymentOrderResponse,
	PaymentOrderRequest,
	AxiosError
>({
	mutationKey: ['payment-order'],
	mutationFn: async variables => {
		const res = await orderApi.paymentOrder(variables);
		return res.data;
	},
});

export const usePaymentPackage = createMutation<
	PaymentOrderResponse,
	PaymentPackageRequest,
	AxiosError
>({
	mutationKey: ['payment-package'],
	mutationFn: async variables => {
		const res = await orderApi.paymentPackage(variables);
		return res.data;
	},
});
