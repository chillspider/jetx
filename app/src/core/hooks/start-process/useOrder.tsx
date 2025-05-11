import { AxiosError } from 'axios';
import { createQuery } from 'react-query-kit';

import { OrderDto } from '@/models/order/order.dto';
import orderApi from '@/services/order/order-service';

type Variables = {
	id: string;
};

export const useOrder = createQuery<OrderDto, Variables, AxiosError>({
	queryKey: ['order'],
	fetcher: async variables => {
		const res = await orderApi.getOrder(variables.id);
		return res.data;
	},
});
