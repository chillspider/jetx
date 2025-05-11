import { ResponseDto } from "@/models/responses/response.dto";
import BaseService from "../base.service";
import publicClient from "../public-client";
import { DeviceStatusDto } from "@/models/device-status.dto";
import { KioskClientProfileResponse } from "@/models/responses/kiosk-client-profile.response";
import { OrderDto } from "@/models/order.dto";
import { QRPaymentDto } from "@/models/qr-payment.dto";

class KioskClientService extends BaseService {
	constructor() {
		super(publicClient);
	}

	async getClientSession(
		sessionId: string
	): Promise<ResponseDto<KioskClientProfileResponse>> {
		return this.post<ResponseDto<KioskClientProfileResponse>>(
			`/api/v1/kiosk-client/verify/${sessionId}`,
			{}
		);
	}

	async getDeviceStatus(): Promise<ResponseDto<DeviceStatusDto>> {
		return this.get<ResponseDto<DeviceStatusDto>>(
			`/api/v1/kiosk-client/device/status`
		);
	}

	async createPayment(modeId: string): Promise<ResponseDto<QRPaymentDto>> {
		return this.post<ResponseDto<QRPaymentDto>>(
			`/api/v1/kiosk-client/payment`,
			{
				modeId,
			}
		);
	}

	async getClientOrder(id: string): Promise<ResponseDto<OrderDto>> {
		return this.get<ResponseDto<OrderDto>>(`/api/v1/orders/${id}`);
	}
}

const kioskClientApi = new KioskClientService();
export default kioskClientApi;
