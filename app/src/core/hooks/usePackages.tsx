import { AxiosError } from 'axios';
import { createQuery } from 'react-query-kit';

import { PackageDto } from '@/models/package/package.dto';
import packageApi from '@/services/package/package-api';

export const usePackages = createQuery<PackageDto[], any, AxiosError>({
	queryKey: ['packages'],
	fetcher: async variables => {
		const res = await packageApi.getPackages();
		return res.data || [];
	},
});
