import { LoginResponse } from "@/models/responses/login.response";
import { ResponseDto } from "@/models/responses/response.dto";
import BaseService from "../base.service";
import kioskClient from "../kiosk-client";
import { KioskProfileDto } from "@/models/responses/kiosk-profile.response";
import { KioskSessionQRDto } from "@/models/responses/kiosk-session-qr.response";
import { OrderDto } from "@/models/order.dto";

class KioskService extends BaseService {
	constructor() {
		super(kioskClient);
	}

	async onboard(code: string): Promise<ResponseDto<LoginResponse>> {
		return this.post<ResponseDto<LoginResponse>>("/api/v1/kiosks/onboard", {
			code,
		});
	}

	async getProfile(): Promise<ResponseDto<KioskProfileDto>> {
		return this.get<ResponseDto<KioskProfileDto>>("/api/v1/kiosks/profile");
	}

	async heartbeat(): Promise<ResponseDto<boolean>> {
		return this.post<ResponseDto<boolean>>("/api/v1/kiosks/heartbeat", {});
	}

	async refreshQRCode(): Promise<ResponseDto<KioskSessionQRDto>> {
		return this.post<ResponseDto<KioskSessionQRDto>>(
			"/api/v1/kiosks/refresh",
			{}
		);
	}

	async getOrder(id: string): Promise<ResponseDto<OrderDto>> {
		return this.get<ResponseDto<OrderDto>>(`/api/v1/orders/${id}`);
	}
}

const kioskApi = new KioskService();
export default kioskApi;
