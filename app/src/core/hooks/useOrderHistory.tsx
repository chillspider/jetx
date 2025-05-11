import { AxiosError } from 'axios';
import { createInfiniteQuery } from 'react-query-kit';

import { PaginationRequestDto } from '@/models/commons/pagination-request.dto';
import { PaginationResponseDto } from '@/models/commons/pagination-response.dto';
import { OrderDto } from '@/models/order/order.dto';
import orderApi from '@/services/order/order-service';

export const useOrderHistory = createInfiniteQuery<
	PaginationResponseDto<OrderDto>,
	PaginationRequestDto,
	AxiosError
>({
	queryKey: ['orders-history'],
	fetcher: (variables, { pageParam }): Promise<PaginationResponseDto<OrderDto>> => {
		return orderApi.getOrdersHistory({ ...variables, pageIndex: pageParam }).then(res => res.data);
	},
	getNextPageParam: lastPage => (lastPage.hasNextPage ? lastPage.pageIndex! + 1 : undefined),
	initialPageParam: 1,
});
