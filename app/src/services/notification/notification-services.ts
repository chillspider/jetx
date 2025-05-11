import { PaginationRequestDto } from '@/models/commons/pagination-request.dto';
import { ResponseDto } from '@/models/commons/response.dto';
import { NotificationPaginationResponse } from '@/models/notification/notification-paginate.response';

import BaseApi from '../base-api';
import httpClient from '../http-client';

class NotificationApi extends BaseApi {
	constructor() {
		super(httpClient);
	}

	private readonly ENDPOINT = '/api/v1/notifications';

	async getNotifications(
		request: PaginationRequestDto,
	): Promise<ResponseDto<NotificationPaginationResponse>> {
		return this.get<ResponseDto<NotificationPaginationResponse>>(`${this.ENDPOINT}`, request);
	}

	async readNotification(id: string, isRead: boolean): Promise<ResponseDto<boolean>> {
		return this.put<ResponseDto<boolean>>(`${this.ENDPOINT}/read/${id}`, { isRead });
	}

	async readAllNotifications(): Promise<ResponseDto<boolean>> {
		return this.put<ResponseDto<boolean>>(`${this.ENDPOINT}/mark-all-read`, {});
	}

	async deleteNotification(id: string): Promise<ResponseDto<boolean>> {
		return this.delete<ResponseDto<boolean>>(`${this.ENDPOINT}/${id}`);
	}
}

const notificationApi = new NotificationApi();

export default notificationApi;
