/* eslint-disable no-param-reassign */
import axios, { AxiosError, AxiosInstance, AxiosResponse } from 'axios';

import { getAccessToken } from '@/core/store/auth/utils';
import { Env } from '@/env';
import { PaginationResponseDto } from '@/models/commons/pagination-response.dto';
import { ResponseDto } from '@/models/commons/response.dto';
import { VoucherDto } from '@/models/order/voucher.dto';
import { MyVouchersPaginationRequestDto } from '@/models/voucher/my-vouchers-pagination-request.dto';
import { getLanguage } from '@/translations/utils';

import BaseApi from '../base-api';

const httpVoucherClient: AxiosInstance = axios.create({
	baseURL: Env.VOUCHER_API_URL,
	headers: {
		'Content-Type': 'application/json',
	},
});

// Request interceptor to add the access token to headers
httpVoucherClient.interceptors.request.use(
	config => {
		if (config.headers && !config.headers.Authorization) {
			const token = getAccessToken();
			config.headers.Authorization = `Bearer ${token ?? ''}`;
		}
		return config;
	},
	(error: AxiosError) => {
		return Promise.reject(error);
	},
);

httpVoucherClient.interceptors.request.use(
	config => {
		config.headers['Accept-Language'] = getLanguage();
		return config;
	},
	(error: AxiosError) => {
		return Promise.reject(error);
	},
);

// Response interceptor to handle responses globally if needed
httpVoucherClient.interceptors.response.use(
	(response: AxiosResponse) => response,
	(error: AxiosError) => {
		// Handle error globally if needed
		return Promise.reject(error);
	},
);

class VoucherApi extends BaseApi {
	constructor() {
		super(httpVoucherClient);
	}

	private readonly ENDPOINT = '/api/v1';

	async myVouchers(
		request: MyVouchersPaginationRequestDto,
	): Promise<ResponseDto<PaginationResponseDto<VoucherDto>>> {
		return this.get<ResponseDto<PaginationResponseDto<VoucherDto>>>(
			`${this.ENDPOINT}/vouchers/me`,
			request,
		);
	}

	async useRedeemCode(code: string): Promise<ResponseDto<VoucherDto>> {
		return this.post<ResponseDto<VoucherDto>>(`${this.ENDPOINT}/b2b-vouchers/redeem/${code}`, {});
	}
}

const voucherApi = new VoucherApi();

export default voucherApi;
