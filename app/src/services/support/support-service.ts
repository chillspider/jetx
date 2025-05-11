import { makeFormData } from '@/models/commons/make-form';
import { PaginationRequestDto } from '@/models/commons/pagination-request.dto';
import { PaginationResponseDto } from '@/models/commons/pagination-response.dto';
import { ResponseDto } from '@/models/commons/response.dto';
import { CreateSupportRequestDto } from '@/models/support/create-support.request.dto';
import { SupportDto } from '@/models/support/support.dto';

import BaseApi from '../base-api';
import httpClient from '../http-client';

class SupportApi extends BaseApi {
	constructor() {
		super(httpClient);
	}

	private readonly ENDPOINT = '/api/v1/supports';

	async getSupports(
		request: PaginationRequestDto,
	): Promise<ResponseDto<PaginationResponseDto<SupportDto>>> {
		return this.get<ResponseDto<PaginationResponseDto<SupportDto>>>(`${this.ENDPOINT}`, request);
	}

	async createSupport(request: CreateSupportRequestDto): Promise<ResponseDto<boolean>> {
		const { images, ...others } = request;
		const formData = makeFormData(others);

		if (images) {
			images.forEach(e => {
				formData.append('images', {
					uri: e.uri,
					name: e.name,
					type: e.type,
				});
			});
		}

		return this.post<ResponseDto<boolean>>(`${this.ENDPOINT}`, formData, undefined, {
			'Content-Type': 'multipart/form-data',
		});
	}

	async getSupportDetail(id: string): Promise<ResponseDto<SupportDto>> {
		return this.get<ResponseDto<SupportDto>>(`${this.ENDPOINT}/${id}`);
	}
}

const supportApi = new SupportApi();

export default supportApi;
