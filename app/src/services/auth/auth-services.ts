import { LoginDto } from '@/models/auth/request/login.dto';
import { UpdateUserDto } from '@/models/auth/request/update-user.dto';
import { LoginPayloadDto } from '@/models/auth/response/login-payload.dto';
import { UserPayloadDto } from '@/models/auth/response/user-payload.dto';
import { PaginationRequestDto } from '@/models/commons/pagination-request.dto';
import { PaginationResponseDto } from '@/models/commons/pagination-response.dto';
import { ResponseDto } from '@/models/commons/response.dto';
import { PaymentOrderResponse } from '@/models/order/response/payment-order.response.dto';
import { UserTokenDto } from '@/models/payment/user-token.dto';

import BaseApi from '../base-api';
import httpClient from '../http-client';

class UserApi extends BaseApi {
	constructor() {
		super(httpClient);
	}

	private readonly ENDPOINT = '/api/v1/auth';

	private readonly USER = '/api/v1/users';

	private readonly CARD = '/api/v1/card-tokens';

	async login(request: LoginDto): Promise<ResponseDto<LoginPayloadDto>> {
		return this.post<ResponseDto<LoginPayloadDto>>(`${this.ENDPOINT}/login`, request);
	}

	async getProfile(): Promise<ResponseDto<UserPayloadDto>> {
		return this.get<ResponseDto<UserPayloadDto>>(`${this.ENDPOINT}/me`);
	}

	async editProfile(request: UpdateUserDto): Promise<ResponseDto<UserPayloadDto>> {
		return this.put<ResponseDto<UserPayloadDto>>(`${this.ENDPOINT}/me`, request);
	}

	async forgotPassword(email: string): Promise<ResponseDto<boolean>> {
		return this.post<ResponseDto<boolean>>(`${this.ENDPOINT}/password/forgot`, { email });
	}

	async verifyOtp(email: string, otp: string): Promise<ResponseDto<string>> {
		return this.post<ResponseDto<string>>(`${this.ENDPOINT}/password/otp`, { email, otp });
	}

	async resetPassword(
		email: string,
		password: string,
		secret: string,
	): Promise<ResponseDto<boolean>> {
		return this.post<ResponseDto<boolean>>(`${this.ENDPOINT}/password/reset`, {
			email,
			password,
			secret,
		});
	}

	async updatePassword(oldPassword: string, password: string): Promise<ResponseDto<boolean>> {
		return this.put<ResponseDto<boolean>>(`${this.ENDPOINT}/password`, {
			password,
			oldPassword,
		});
	}

	async deleteProfile(): Promise<ResponseDto<boolean>> {
		return this.delete<ResponseDto<boolean>>(`${this.ENDPOINT}/me`);
	}

	async submitReferral(referralCode: string): Promise<ResponseDto<boolean>> {
		return this.post<ResponseDto<boolean>>(`${this.USER}/submit-referral`, {
			referralCode,
		});
	}

	async verifyEmail(): Promise<ResponseDto<any>> {
		return this.post<ResponseDto<any>>(`${this.ENDPOINT}/email/verify/send`, {});
	}

	/*
	Saved Card
	*/
	async getUserCards(
		query: PaginationRequestDto,
	): Promise<ResponseDto<PaginationResponseDto<UserTokenDto>>> {
		return this.get(`${this.CARD}`, query);
	}

	async deleteCard(id: string): Promise<ResponseDto<boolean>> {
		return this.delete(`${this.CARD}/${id}`);
	}

	async defaultCard(id: string): Promise<ResponseDto<boolean>> {
		return this.put(`${this.CARD}/default/${id}`, {});
	}

	async addNewCard(): Promise<ResponseDto<PaymentOrderResponse>> {
		return this.post(`${this.CARD}`, {});
	}

	/*
	Device Token
	*/
	async registerDeviceToken(token: string): Promise<ResponseDto<boolean>> {
		return this.post<ResponseDto<boolean>>(`${this.USER}/register-device`, { token });
	}

	async removeDeviceToken(token: string): Promise<ResponseDto<boolean>> {
		return this.post<ResponseDto<boolean>>(`${this.USER}/remove-device`, { token });
	}
}

const userApi = new UserApi();

export default userApi;
