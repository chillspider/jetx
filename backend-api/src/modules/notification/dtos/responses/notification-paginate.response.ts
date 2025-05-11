import { PaginationResponseDto } from '../../../../common/dto/pagination-response.dto';
import { NumberField } from '../../../../decorators';
import { NotificationDto } from '../notification.dto';

export class NotificationPaginationResponse extends PaginationResponseDto<NotificationDto> {
  @NumberField()
  totalUnread: number;
}
