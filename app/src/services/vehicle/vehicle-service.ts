import { makeFormData } from '@/models/commons/make-form';
import { PaginationRequestDto } from '@/models/commons/pagination-request.dto';
import { PaginationResponseDto } from '@/models/commons/pagination-response.dto';
import { ResponseDto } from '@/models/commons/response.dto';
import { CreateVehicleDto } from '@/models/vehicle/request/create-vehicle.dto';
import { UpdateVehicleDto } from '@/models/vehicle/request/update-vehicle.dto';
import { VehicleDto } from '@/models/vehicle/vehicle.dto';

import BaseApi from '../base-api';
import httpClient from '../http-client';

class VehicleApi extends BaseApi {
	constructor() {
		super(httpClient);
	}

	private readonly ENDPOINT = '/api/v1/vehicles';

	async getVehicles(
		request: PaginationRequestDto,
	): Promise<ResponseDto<PaginationResponseDto<VehicleDto>>> {
		return this.get<ResponseDto<PaginationResponseDto<VehicleDto>>>(`${this.ENDPOINT}`, request);
	}

	async getVehicleById(id: string): Promise<ResponseDto<VehicleDto>> {
		return this.get<ResponseDto<VehicleDto>>(`${this.ENDPOINT}/${id}`);
	}

	async createVehicle(request: CreateVehicleDto): Promise<ResponseDto<VehicleDto>> {
		const { featureImage, ...others } = request;

		const formData = makeFormData(others);

		if (featureImage) {
			formData.append('featureImage', {
				uri: featureImage.uri,
				name: featureImage.name,
				type: featureImage.type,
			});
		}

		return this.post<ResponseDto<VehicleDto>>(`${this.ENDPOINT}`, formData, undefined, {
			'Content-Type': 'multipart/form-data',
		});
	}

	async updateVehicle(request: UpdateVehicleDto): Promise<ResponseDto<VehicleDto>> {
		const { featureImage, ...others } = request;

		const formData = makeFormData(others);

		if (featureImage) {
			formData.append('featureImage', {
				uri: featureImage.uri,
				name: featureImage.name,
				type: featureImage.type,
			});
		}

		return this.put<ResponseDto<VehicleDto>>(`${this.ENDPOINT}`, formData, undefined, {
			'Content-Type': 'multipart/form-data',
		});
	}

	async deleteVehicle(id: string): Promise<ResponseDto<boolean>> {
		return this.delete<ResponseDto<boolean>>(`${this.ENDPOINT}/${id}`);
	}
}

const vehicleApi = new VehicleApi();

export default vehicleApi;
