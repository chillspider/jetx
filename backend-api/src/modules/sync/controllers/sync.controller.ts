import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { BaseController } from '../../../common/controllers/base.controller';
import { ResponseDto } from '../../../common/dto/response.dto';
import { Auth, UUIDParam } from '../../../decorators';
import { ApiResponseDto } from '../../../decorators/api-response';
import { Role } from '../../role-permission/enums/roles.enum';
import { SyncOrderRequestDto } from '../dtos/requests/sync-order.request.dto';
import { SyncTypeEnum } from '../enums/sync-action.enum';
import { SyncService } from '../services/sync.service';

@Controller({
  path: 'syncs',
  version: '1',
})
@ApiTags('Syncs')
@Auth({ roles: [Role.SA] })
export class SyncController extends BaseController {
  constructor(private readonly _syncService: SyncService) {
    super();
  }

  @Post('')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sync all' })
  @ApiResponseDto({ type: Boolean })
  public async sync(): Promise<ResponseDto<boolean>> {
    await this._syncService.handleSyncs();
    return this.getResponse(true, true);
  }

  @Post('users')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sync users' })
  @ApiResponseDto({ type: Boolean })
  public async syncUsers(): Promise<ResponseDto<boolean>> {
    await this._syncService.handleRetrySyncs({
      type: SyncTypeEnum.USER,
    });
    await this._syncService.handleSyncUsers();
    return this.getResponse(true, true);
  }

  @Post('orders')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sync orders' })
  @ApiResponseDto({ type: Boolean })
  public async syncOrders(
    @Body() req: SyncOrderRequestDto,
  ): Promise<ResponseDto<boolean>> {
    switch (req.type) {
      case 'retry':
        await this._syncService.handleRetrySyncs({
          type: SyncTypeEnum.ORDER,
        });
        await this._syncService.handleRetrySyncs({
          type: SyncTypeEnum.ORDER_ITEM,
        });
        await this._syncService.handleRetrySyncs({
          type: SyncTypeEnum.ORDER_TRANSACTION,
        });
        break;
      case 'unSync':
        await this._syncService.handleSyncOrders();
        break;
      default:
        break;
    }
    return this.getResponse(true, true);
  }

  @Post('orders/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sync order by id' })
  @ApiResponseDto({ type: Boolean })
  public async syncOrder(
    @UUIDParam('id') id: string,
  ): Promise<ResponseDto<boolean>> {
    await this._syncService.handleSync(id, SyncTypeEnum.ORDER);
    return this.getResponse(true, true);
  }

  @Post('users/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sync user by id' })
  @ApiResponseDto({ type: Boolean })
  public async syncUser(
    @UUIDParam('id') id: string,
  ): Promise<ResponseDto<boolean>> {
    await this._syncService.handleSync(id, SyncTypeEnum.USER);
    return this.getResponse(true, true);
  }

  @Post('campaigns/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sync campaign by id' })
  @ApiResponseDto({ type: Boolean })
  public async syncCampaign(
    @UUIDParam('id') id: string,
  ): Promise<ResponseDto<boolean>> {
    await this._syncService.handleSync(id, SyncTypeEnum.CAMPAIGN);
    return this.getResponse(true, true);
  }

  /**
   * @deprecated
   */
  @Post('migrate-detector-images')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Migrate detector images' })
  @ApiResponseDto({ type: Boolean })
  public async migrateDetectorImages(): Promise<ResponseDto<boolean>> {
    await this._syncService.migrateDetectorImages();
    return this.getResponse(true, true);
  }

  @Post('migrate-user-station-id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Migrate user station id' })
  @ApiResponseDto({ type: Boolean })
  public async migrateUserStationId(): Promise<ResponseDto<boolean>> {
    await this._syncService.migrateUserStationId();
    return this.getResponse(true, true);
  }

  @Post('migrate-station-for-package-orders')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Migrate station for package orders' })
  @ApiResponseDto({ type: Boolean })
  public async migrateStationForPackageOrders(): Promise<ResponseDto<boolean>> {
    await this._syncService.migrateStationForPackageOrders();
    return this.getResponse(true, true);
  }
}
