import { AxiosError } from 'axios';
import { createQuery } from 'react-query-kit';

import { PaymentMethodModel } from '@/models/payment/payment-method-model';
import paymentApi from '@/services/payment/payment-service';

type Variables = {
	type?: string;
};

export const usePaymentMethod = createQuery<PaymentMethodModel[], Variables, AxiosError>({
	queryKey: ['payment-methods'],
	fetcher: async variables => {
		const res = await paymentApi.getPaymentMethods(variables.type || 'default');
		return res.data.sort((a, b) => {
			const aIsDefault = a.isDefault ?? false;
			const bIsDefault = b.isDefault ?? false;
			// eslint-disable-next-line no-nested-ternary
			return aIsDefault === bIsDefault ? 0 : aIsDefault ? -1 : 1;
		});
	},
});
