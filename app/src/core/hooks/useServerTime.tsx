import { AxiosError } from 'axios';
import { createQuery } from 'react-query-kit';

import { getServerTime } from '@/utils/date-utils';

export const useServerTime = createQuery<Date, void, AxiosError>({
	queryKey: ['server-time'],
	fetcher: async () => {
		const res = await getServerTime();
		return res.toDate();
	},
});
