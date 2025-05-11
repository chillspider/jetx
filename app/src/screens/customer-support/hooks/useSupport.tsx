import { AxiosError } from 'axios';
import { createInfiniteQuery } from 'react-query-kit';

import { PaginationRequestDto } from '@/models/commons/pagination-request.dto';
import { PaginationResponseDto } from '@/models/commons/pagination-response.dto';
import { SupportDto } from '@/models/support/support.dto';
import supportApi from '@/services/support/support-service';

export const useSupports = createInfiniteQuery<
	PaginationResponseDto<SupportDto>,
	PaginationRequestDto,
	AxiosError
>({
	queryKey: ['my-supports'],
	fetcher: async (variables, { pageParam }): Promise<PaginationResponseDto<SupportDto>> => {
		const res = await supportApi.getSupports({
			...variables,
			pageIndex: pageParam,
		});

		return res.data;
	},
	getNextPageParam: lastPage => (lastPage.hasNextPage ? lastPage.pageIndex! + 1 : undefined),
	initialPageParam: 1,
});
