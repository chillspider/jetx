// eslint-disable-next-line simple-import-sort/imports
import { PaginationResponseDto } from '@/models/commons/pagination-response.dto';
import { ResponseDto } from '@/models/commons/response.dto';

import { PaginationRequestDto } from '@/models/commons/pagination-request.dto';
import { DeviceDto } from '@/models/devices/device.dto';
import { MachineInfoDto } from '@/models/yigoli/machine-info.dto';
import BaseApi from '../base-api';
import httpClient from '../http-client';

class DeviceApi extends BaseApi {
	constructor() {
		super(httpClient);
	}

	private readonly ENDPOINT = '/api/v1/devices';

	async getDevices(
		request: PaginationRequestDto,
	): Promise<ResponseDto<PaginationResponseDto<DeviceDto>>> {
		return this.get<ResponseDto<PaginationResponseDto<DeviceDto>>>(`${this.ENDPOINT}`, request);
	}

	async getDeviceByStation(stationId: string): Promise<ResponseDto<DeviceDto[]>> {
		return this.get<ResponseDto<DeviceDto[]>>(`${this.ENDPOINT}/station/${stationId}`);
	}

	async getDevice(id: string): Promise<ResponseDto<DeviceDto>> {
		return this.get<ResponseDto<DeviceDto>>(`${this.ENDPOINT}/${id}`);
	}

	async getDeviceStatus(id: string): Promise<ResponseDto<MachineInfoDto>> {
		return this.get<ResponseDto<MachineInfoDto>>(`${this.ENDPOINT}/status/${id}`);
	}
}

const deviceApi = new DeviceApi();

export default deviceApi;
