import { AxiosError } from 'axios';
import { createMutation } from 'react-query-kit';

import { OperationOrderDeviceRequest } from '@/models/order/request/operation-order-device.request';
import orderApi from '@/services/order/order-service';

export const useOperationOrder = createMutation<boolean, OperationOrderDeviceRequest, AxiosError>({
	mutationKey: ['operation-order'],
	mutationFn: async variables => {
		const res = await orderApi.operationOrderDevice(variables);
		return res.data;
	},
});
