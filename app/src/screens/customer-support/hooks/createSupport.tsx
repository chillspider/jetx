import { AxiosError } from 'axios';
import { createMutation } from 'react-query-kit';

import { CreateSupportRequestDto } from '@/models/support/create-support.request.dto';
import supportApi from '@/services/support/support-service';

export const useCreateSupport = createMutation<boolean, CreateSupportRequestDto, AxiosError>({
	mutationKey: ['create-support'],
	mutationFn: async variables => {
		return supportApi.createSupport(variables).then(res => res.data);
	},
});
