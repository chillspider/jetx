import { AxiosError } from 'axios';
import { createInfiniteQuery } from 'react-query-kit';

import { PaginationRequestDto } from '@/models/commons/pagination-request.dto';
import { NotificationPaginationResponse } from '@/models/notification/notification-paginate.response';
import notificationApi from '@/services/notification/notification-services';

export const useNotification = createInfiniteQuery<
	NotificationPaginationResponse,
	PaginationRequestDto,
	AxiosError
>({
	queryKey: ['notifications'],
	fetcher: async (variables, { pageParam }) => {
		const res = await notificationApi.getNotifications({ ...variables, pageIndex: pageParam });
		return res.data;
	},
	getNextPageParam: lastPage => (lastPage.hasNextPage ? lastPage.pageIndex! + 1 : undefined),
	initialPageParam: 1,
});
