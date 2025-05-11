import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Put,
  Query,
  ValidationPipe,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { BaseController } from '../../../common/controllers/base.controller';
import { PaginationRequestDto } from '../../../common/dto/pagination-request.dto';
import { ResponseDto } from '../../../common/dto/response.dto';
import { Auth, UUIDParam } from '../../../decorators';
import {
  ApiPageResponse,
  ApiResponseDto,
} from '../../../decorators/api-response';
import { Role } from '../../role-permission/enums/roles.enum';
import { NotificationDto } from '../dtos/notification.dto';
import { NotificationRequestDto } from '../dtos/requests/notification.request';
import { ReadNotificationRequest } from '../dtos/requests/read-notification.request';
import { NotificationPaginationResponse } from '../dtos/responses/notification-paginate.response';
import { NotificationService } from '../services/notification.service';

@Controller({
  path: 'notifications',
  version: '1',
})
@ApiTags('Notifications')
export class NotificationController extends BaseController {
  constructor(private readonly _notificationService: NotificationService) {
    super();
  }

  @Get()
  @Auth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get notifications list' })
  @ApiPageResponse({ type: NotificationDto })
  async getNotifications(
    @Query(new ValidationPipe({ transform: true }))
    query: PaginationRequestDto,
  ): Promise<ResponseDto<NotificationPaginationResponse>> {
    const result = await this._notificationService.getNotifications(query);
    return this.getResponse(true, result);
  }

  @Put('read/:id')
  @Auth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Read notification' })
  @ApiResponseDto({ type: Boolean })
  async read(
    @UUIDParam('id') id: string,
    @Body() dto: ReadNotificationRequest,
  ) {
    const isUpdated = await this._notificationService.readNotification(
      id,
      dto.isRead,
    );
    return this.getResponse(true, isUpdated);
  }

  @Put('mark-all-read')
  @Auth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark all as read notifications' })
  @ApiResponseDto({ type: Boolean })
  async markAllRead() {
    const isUpdated = await this._notificationService.markAllAsRead();
    return this.getResponse(true, isUpdated);
  }

  @Delete(':id')
  @Auth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete notification' })
  @ApiResponseDto({ type: Boolean })
  async delete(@UUIDParam('id') id: string) {
    const isDeleted = await this._notificationService.delete(id);
    return this.getResponse(true, isDeleted);
  }

  @Post('all')
  @Auth({ roles: [Role.SA] })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Notify all users' })
  @ApiResponseDto({ type: String })
  async notifyAll(
    @Body() dto: NotificationRequestDto,
  ): Promise<ResponseDto<string>> {
    const result = await this._notificationService.notifyAll(dto);
    return this.getResponse(true, result);
  }
}
