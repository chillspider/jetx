import { ResponseDto } from '@/models/commons/response.dto';
import { VoucherExcludedReasonDto } from '@/models/setting/voucher-excluded-reason.dto';

import BaseApi from '../base-api';
import httpClient from '../http-client';

class SettingApi extends BaseApi {
	constructor() {
		super(httpClient);
	}

	private readonly ENDPOINT = '/api/v1/settings';

	async getServerTime(): Promise<ResponseDto<Date>> {
		return this.get<ResponseDto<Date>>(`${this.ENDPOINT}/server-time`);
	}

	async getVoucherExcludedReasons(): Promise<ResponseDto<VoucherExcludedReasonDto>> {
		return this.get<ResponseDto<VoucherExcludedReasonDto>>(
			`${this.ENDPOINT}/voucher-excluded-reason`,
		);
	}
}

const settingApi = new SettingApi();

export default settingApi;
