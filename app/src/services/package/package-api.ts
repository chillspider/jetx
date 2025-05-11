import { ResponseDto } from '@/models/commons/response.dto';
import { PackageDto } from '@/models/package/package.dto';

import BaseApi from '../base-api';
import httpClient from '../http-client';

class PackageApi extends BaseApi {
	constructor() {
		super(httpClient);
	}

	private readonly ENDPOINT = '/api/v1/packages';

	async getPackages(): Promise<ResponseDto<PackageDto[]>> {
		return this.get<ResponseDto<PackageDto[]>>(`${this.ENDPOINT}`);
	}
}

const packageApi = new PackageApi();

export default packageApi;
