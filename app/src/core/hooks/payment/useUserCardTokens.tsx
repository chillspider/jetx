import { AxiosError } from 'axios';
import { createInfiniteQuery, createMutation, createQuery } from 'react-query-kit';

import { PaginationRequestDto } from '@/models/commons/pagination-request.dto';
import { PaginationResponseDto } from '@/models/commons/pagination-response.dto';
import { UserTokenDto } from '@/models/payment/user-token.dto';
import userApi from '@/services/auth/auth-services';

export const useUserCardTokens = createInfiniteQuery<
	PaginationResponseDto<UserTokenDto>,
	PaginationRequestDto,
	AxiosError
>({
	queryKey: ['user-card-tokens'],
	fetcher: async (variables, { pageParam }): Promise<PaginationResponseDto<UserTokenDto>> => {
		const res = await userApi.getUserCards({
			...variables,
			pageIndex: pageParam,
		});
		return res.data;
	},
	getNextPageParam: lastPage => (lastPage.hasNextPage ? lastPage.pageIndex! + 1 : undefined),
	initialPageParam: 1,
});

export const useDeleteCard = createMutation<boolean, string, AxiosError>({
	mutationKey: ['delete-user-token'],
	mutationFn: async id => {
		const res = await userApi.deleteCard(id);
		return res.data;
	},
});

export const useDefaultCard = createMutation<boolean, string, AxiosError>({
	mutationKey: ['default-user-token'],
	mutationFn: async id => {
		const res = await userApi.defaultCard(id);
		return res.data;
	},
});

export const useAddCard = createQuery<string, void, AxiosError>({
	queryKey: ['add-new-card-token'],
	fetcher: () => {
		return userApi.addNewCard().then(res => res.data.endpoint || '');
	},
});
