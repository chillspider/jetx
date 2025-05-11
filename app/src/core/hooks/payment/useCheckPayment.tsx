import { AxiosError } from 'axios';
import { createQuery } from 'react-query-kit';

import orderApi from '@/services/order/order-service';

type Variables = {
	id: string;
};

export const usePayment = createQuery<boolean, Variables, AxiosError>({
	queryKey: ['check-payment-order'],
	fetcher: async variables => {
		const res = await orderApi.checkPayment(variables.id);
		return res.data;
	},
});
