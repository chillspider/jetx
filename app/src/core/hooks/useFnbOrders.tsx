import { AxiosError } from 'axios';
import { createMutation, createQuery } from 'react-query-kit';

import { BBCategoryDto } from '@/models/bitebolt/bb-category.dto';
import { BBProductDto } from '@/models/bitebolt/bb-product.dto';
import { BBGetPublicProducts } from '@/models/bitebolt/request/bb-get-product.request.dto';
import { OrderDto } from '@/models/order/order.dto';
import { FnbCreateOrderRequest } from '@/models/order/request/fnb-order.request.dto';
import { PaymentOrderRequest } from '@/models/order/request/payment-order.request';
import { PaymentOrderResponse } from '@/models/order/response/payment-order.response.dto';
import biteboltApi from '@/services/bitebolt/bitebolt-service';

export const useProducts = createQuery<BBProductDto[], BBGetPublicProducts, AxiosError>({
	queryKey: ['bb-products'],
	fetcher: async variables => {
		const res = await biteboltApi.getProducts(variables);
		return res.data || [];
	},
});

export const useCategories = createQuery<BBCategoryDto[], string, AxiosError>({
	queryKey: ['bb-categories'],
	fetcher: async shopId => {
		const res = await biteboltApi.getCategories(shopId);
		return res.data || [];
	},
});

export const useCreateOrder = createMutation<OrderDto, FnbCreateOrderRequest, AxiosError>({
	mutationKey: ['create-bb-order'],
	mutationFn: async variables => {
		const res = await biteboltApi.createOrder(variables);
		return res.data;
	},
});

export const useFnbPaymentOrder = createMutation<
	PaymentOrderResponse,
	PaymentOrderRequest,
	AxiosError
>({
	mutationKey: ['fnb-payment-order'],
	mutationFn: async variables => {
		const res = await biteboltApi.paymentOrder(variables);
		return res.data;
	},
});
