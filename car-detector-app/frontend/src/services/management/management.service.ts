import { ResponseDto } from "@/models/responses/response.dto";
import BaseService from "../base.service";
import httpClient from "../http-client";
import { OrderInfoDto } from "@/models/order-info.dto";
import { CreateCarDetectorRequest } from "@/models/requests/create-car-detector.request";
import { base64ToBlob, objectToFormData } from "@/lib/utils";
import { CarModelDto } from "@/models/car-model.dto";

class ManagementService extends BaseService {
	constructor() {
		super(httpClient);
	}

	async getOrderByDeviceId(
		deviceId: string
	): Promise<ResponseDto<OrderInfoDto>> {
		return this.get(`/api/v1/detectors/orders/${deviceId}`);
	}

	async createCarDetector(
		req: CreateCarDetectorRequest,
		image: string
	): Promise<ResponseDto<boolean>> {
		const imageBlob = base64ToBlob(image);
		console.log(imageBlob);
		const formData = objectToFormData({ ...req, image: imageBlob });
		for (const [key, value] of formData.entries()) {
			console.log(key, value);
		}
		return this.post(
			`/api/v1/detectors`,
			formData,
			{},
			{
				"Content-Type": "multipart/form-data",
			}
		);
	}

	async analyzeCar(base64Image: string): Promise<ResponseDto<CarModelDto>> {
		const blob = base64ToBlob(base64Image);
		const formData = objectToFormData({ image: blob });

		return this.post(
			"/api/v1/detectors/analyze-car",
			formData,
			{},
			{
				"Content-Type": "multipart/form-data",
			}
		);
	}
}

const managementApi = new ManagementService();
export default managementApi;
