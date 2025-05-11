import { AxiosError } from 'axios';
import { createQuery } from 'react-query-kit';

import { SupportDto } from '@/models/support/support.dto';
import supportApi from '@/services/support/support-service';

type Variables = {
	id: string;
};

export const useSupportDetail = createQuery<SupportDto, Variables, AxiosError>({
	queryKey: ['support-detail'],
	fetcher: async variables => {
		const res = await supportApi.getSupportDetail(variables.id);
		return res.data;
	},
});
