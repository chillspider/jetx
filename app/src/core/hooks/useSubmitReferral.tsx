import { AxiosError } from 'axios';
import { createMutation } from 'react-query-kit';

import userApi from '@/services/auth/auth-services';

export const useSubmitReferral = createMutation<boolean, { referral: string }, AxiosError>({
	mutationFn: async variables => {
		return userApi.submitReferral(variables.referral).then(res => res.data);
	},
});
