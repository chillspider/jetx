import { AxiosError } from 'axios';
import { createInfiniteQuery, createMutation, createQuery } from 'react-query-kit';

import { PaginationResponseDto } from '@/models/commons/pagination-response.dto';
import { VoucherDto } from '@/models/order/voucher.dto';
import { VoucherExcludedReasonDto } from '@/models/setting/voucher-excluded-reason.dto';
import { MyVouchersPaginationRequestDto } from '@/models/voucher/my-vouchers-pagination-request.dto';
import settingApi from '@/services/setting/setting-services';
import voucherApi from '@/services/voucher/voucher-service';

export const useVouchers = createInfiniteQuery<
	PaginationResponseDto<VoucherDto>,
	MyVouchersPaginationRequestDto,
	AxiosError
>({
	queryKey: ['my-vouchers'],
	fetcher: async (variables, { pageParam }): Promise<PaginationResponseDto<VoucherDto>> => {
		const res = await voucherApi.myVouchers({
			...variables,
			pageIndex: pageParam,
		});

		return res.data;
	},
	getNextPageParam: lastPage => (lastPage.hasNextPage ? lastPage.pageIndex! + 1 : undefined),
	initialPageParam: 1,
});

export const useVoucherAll = createQuery<VoucherDto[], void, AxiosError>({
	queryKey: ['voucher-all'],
	fetcher: async () => {
		const res = await voucherApi.myVouchers({ takeAll: true });
		return res.data.data || [];
	},
});

export const useRedeemCode = createMutation<VoucherDto, string, AxiosError>({
	mutationFn: async variables => {
		const res = await voucherApi.useRedeemCode(variables);
		return res.data;
	},
});

export const useVoucherExcludedReasons = createQuery<VoucherExcludedReasonDto, any, AxiosError>({
	queryKey: ['voucher-excluded-reasons'],
	fetcher: () => {
		return settingApi.getVoucherExcludedReasons().then(res => res.data);
	},
});
