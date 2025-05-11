import { PaginationResponseDto } from '../commons/pagination-response.dto';
import { NotificationDto } from './notification.dto';

export class NotificationPaginationResponse extends PaginationResponseDto<NotificationDto> {
	totalUnread!: number;
}
