import { LoginRequest } from "@/models/requests/login.request";
import { LoginResponse } from "@/models/responses/login.response";
import { ResponseDto } from "@/models/responses/response.dto";
import BaseService from "../base.service";
import httpClient from "../http-client";

class AuthService extends BaseService {
	constructor() {
		super(httpClient);
	}

	async login(request: LoginRequest): Promise<ResponseDto<LoginResponse>> {
		return this.post<ResponseDto<LoginResponse>>(
			"/api/v1/auth/assistant/login",
			request
		);
	}
}

const authApi = new AuthService();
export default authApi;
