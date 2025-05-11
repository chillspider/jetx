import { AxiosError } from 'axios';
import { createMutation } from 'react-query-kit';

import orderApi from '@/services/order/order-service';

export const useCancelPayment = createMutation<boolean, string, AxiosError>({
	mutationKey: ['cancel-payment-order'],
	mutationFn: async id => {
		const res = await orderApi.cancelPaymentOrder(id);
		return res.data;
	},
});
