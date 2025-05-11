import { AxiosError } from 'axios';
import { createMutation } from 'react-query-kit';

import userApi from '@/services/auth/auth-services';

export const useVerifyEmail = createMutation<any, any, AxiosError>({
	mutationFn: async () => {
		return userApi.verifyEmail();
	},
});
