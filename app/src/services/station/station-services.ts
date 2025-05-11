// eslint-disable-next-line simple-import-sort/imports
import { PaginationResponseDto } from '@/models/commons/pagination-response.dto';
import { ResponseDto } from '@/models/commons/response.dto';
import { StationListRequestDto } from '@/models/stations/station-list-request';
import { StationDto } from '@/models/stations/station.dto';

import BaseApi from '../base-api';
import httpClient from '../http-client';

class StationApi extends BaseApi {
	constructor() {
		super(httpClient);
	}

	private readonly ENDPOINT = '/api/v1/stations';

	async getStations(
		request: StationListRequestDto,
	): Promise<ResponseDto<PaginationResponseDto<StationDto>>> {
		return this.get<ResponseDto<PaginationResponseDto<StationDto>>>(`${this.ENDPOINT}`, request);
	}

	async getStation(id: string): Promise<ResponseDto<StationDto>> {
		return this.get<ResponseDto<StationDto>>(`${this.ENDPOINT}/${id}`);
	}
}

const stationApi = new StationApi();

export default stationApi;
