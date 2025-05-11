import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  UploadedFiles,
  ValidationPipe,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { BaseController } from '../../../common/controllers/base.controller';
import { PaginationRequestDto } from '../../../common/dto/pagination-request.dto';
import { PaginationResponseDto } from '../../../common/dto/pagination-response.dto';
import { ResponseDto } from '../../../common/dto/response.dto';
import { ApiFile, Auth, UUIDParam } from '../../../decorators';
import {
  ApiPageResponse,
  ApiResponseDto,
} from '../../../decorators/api-response';
import { BBShopDto } from '../../bitebolt/dtos/bb-shop.dto';
import { BiteboltService } from '../../bitebolt/services/bitebolt.service';
import { AttentionDto } from '../../device/dtos/attention.dto';
import { DeviceDto } from '../../device/dtos/device.dto';
import {
  CreateDeviceDto,
  UpdateDeviceDto,
} from '../../device/dtos/requests/create-device.dto';
import { AttentionService } from '../../device/services/attention.service';
import { DeviceService } from '../../device/services/device.service';
import { ExportReferralRequest } from '../../export/dtos/export-referral.request';
import { ExportRefundRequest } from '../../export/dtos/export-refund.request';
import { ExportService } from '../../export/services/export.service';
import {
  NflowCampaignDto,
  UpdateNflowCampaignDto,
} from '../../notification/dtos/nflow-campaign.dto';
import { NotificationCampaignEntity } from '../../notification/entities/notification-campaign.entity';
import { CampaignService } from '../../notification/services/campaign.service';
import { PackageDto } from '../../package/dtos/package.dto';
import { PackageService } from '../../package/services/package.service';
import { ModeAndProductDto } from '../../product/dtos/mode.dto';
import { ProductDto } from '../../product/dtos/product.dto';
import { ProductService } from '../../product/services/product.service';
import { Role } from '../../role-permission/enums/roles.enum';
import {
  CreateStationDto,
  UpdateStationDto,
} from '../../station/dtos/requests/create-station.dto';
import { StationDto } from '../../station/dtos/station.dto';
import {
  CreateStationModeDto,
  StationModeDto,
} from '../../station/dtos/station-mode.dto';
import { StationService } from '../../station/services/station.service';
import { StationModeService } from '../../station/services/station-mode.service';
import { UpdateSupportRequestDto } from '../../support/dtos/requests/update-support.request.dto';
import { SupportService } from '../../support/services/support.service';
import { SyncTypeEnum } from '../../sync/enums/sync-action.enum';
import { SyncService } from '../../sync/services/sync.service';
import { InvoiceDto } from '../../tax/dtos/invoice.dto';
import { SendInvoiceRequestDto } from '../../tax/dtos/requests/send-invoice.request.dto';
import { InvoiceService } from '../../tax/services/invoice.service';
import { ReferralDto } from '../../user/dtos/referral.dto';
import { UpdateUserNoteDto } from '../../user/dtos/requests/update-user-note.dto';
import { UpdateUserStatusDto } from '../../user/dtos/requests/update-user-status.dto';
import { UserDto } from '../../user/dtos/user.dto';
import { ReferralService } from '../../user/services/referral.service';
import { UserService } from '../../user/services/user.service';
import { NflowSyncOrderRequest } from '../dtos/requests/nflow-sync-order.request.dto';
import { NflowResourceService } from '../services/nflow-resource.service';

@Controller({
  path: 'nflow',
  version: '1',
})
@ApiTags('Nflow APIs')
@Auth({ roles: [Role.ADMIN, Role.SA] })
export class NflowController extends BaseController {
  constructor(
    private readonly _resourceService: NflowResourceService,
    private readonly _stationService: StationService,
    private readonly _productService: ProductService,
    private readonly _deviceService: DeviceService,
    private readonly _attentionService: AttentionService,
    private readonly _userService: UserService,
    private readonly _invoiceService: InvoiceService,
    private readonly _supportService: SupportService,
    private readonly _stationModeService: StationModeService,
    private readonly _exportService: ExportService,
    private readonly _referralService: ReferralService,
    private readonly _packageService: PackageService,
    private readonly _syncService: SyncService,
    private readonly _biteboltService: BiteboltService,
    private readonly _campaignService: CampaignService,
  ) {
    super();
  }

  //! GENERAL
  @Post('images')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Upload images' })
  @ApiResponseDto({ type: Array<string> })
  @ApiFile({ name: 'files', isArray: true })
  public async uploadImages(
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<ResponseDto<string[]>> {
    const res = await this._resourceService.uploadImages(files);
    return this.getResponse(true, res);
  }

  //! STATIONS
  @Post('stations')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Create a new station' })
  @ApiResponseDto({ type: StationDto })
  async createStation(
    @Body() request: CreateStationDto,
  ): Promise<ResponseDto<StationDto>> {
    const result = await this._stationService.create(request);
    return this.getResponse(true, result);
  }

  @Put('stations')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update station' })
  @ApiResponseDto({ type: Boolean })
  async updateStation(
    @Body() request: UpdateStationDto,
  ): Promise<ResponseDto<boolean>> {
    const isUpdated = await this._stationService.update(request);
    return this.getResponse(true, isUpdated);
  }

  @Delete('stations/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete station' })
  @ApiResponseDto({ type: Boolean })
  async deleteStation(
    @UUIDParam('id') id: string,
  ): Promise<ResponseDto<boolean>> {
    const isUpdated = await this._stationService.delete(id);
    return this.getResponse(true, isUpdated);
  }

  @Get('stations/:stationId/station-modes')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get station mode by stationId' })
  @ApiResponseDto({ type: Array<ModeAndProductDto> })
  async getStationModes(
    @UUIDParam('stationId') stationId: string,
  ): Promise<ResponseDto<ModeAndProductDto[]>> {
    const result = await this._stationModeService.getByStation(stationId);
    return this.getResponse(true, result);
  }

  // ! PRODUCTS
  @Get('products')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get product list' })
  @ApiPageResponse({ type: ProductDto })
  async getProducts(
    @Query(new ValidationPipe({ transform: true }))
    query: PaginationRequestDto,
  ): Promise<ResponseDto<PaginationResponseDto<ProductDto>>> {
    const result: PaginationResponseDto<ProductDto> =
      await this._productService.getProducts(query);
    return this.getResponse(true, result);
  }

  // ! DEVICES
  @Post('devices')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Create a new device' })
  @ApiResponseDto({ type: DeviceDto })
  async createDevice(
    @Body() dto: CreateDeviceDto,
  ): Promise<ResponseDto<DeviceDto>> {
    const result = await this._deviceService.create(dto);
    return this.getResponse(true, result);
  }

  @Put('devices')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update device' })
  @ApiResponseDto({ type: Boolean })
  async updateDevice(
    @Body() dto: UpdateDeviceDto,
  ): Promise<ResponseDto<boolean>> {
    const isUpdated = await this._deviceService.update(dto);
    return this.getResponse(true, isUpdated);
  }

  @Delete('devices/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete device' })
  @ApiResponseDto({ type: Boolean })
  async deleteDevice(
    @UUIDParam('id') id: string,
  ): Promise<ResponseDto<boolean>> {
    const isDeleted = await this._deviceService.delete(id);
    return this.getResponse(true, isDeleted);
  }

  // ! ATTENTIONS
  @Get('attentions')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get attentions' })
  @ApiResponseDto({ type: Array<AttentionDto> })
  async getAttentions(): Promise<ResponseDto<AttentionDto[]>> {
    const result = await this._attentionService.getAttentions();
    return this.getResponse(true, result);
  }

  // ! USERS
  @Put('users/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update user status' })
  @ApiResponseDto({ type: UserDto })
  async updateUserStatus(
    @Body() dto: UpdateUserStatusDto,
  ): Promise<ResponseDto<UserDto>> {
    const isUpdated = await this._userService.updateUserStatus(dto);
    return this.getResponse(true, isUpdated);
  }

  @Put('users/note')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update user note' })
  @ApiResponseDto({ type: UserDto })
  async updateUserNote(
    @Body() dto: UpdateUserNoteDto,
  ): Promise<ResponseDto<UserDto>> {
    const isUpdated = await this._userService.updateUserNote(dto);
    return this.getResponse(true, isUpdated);
  }

  // ! INVOICE
  @Post('invoices/publish/:orderId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Publish order invoice' })
  @ApiResponseDto({ type: InvoiceDto })
  async publishOrderInvoice(
    @UUIDParam('orderId') orderId: string,
  ): Promise<ResponseDto<InvoiceDto>> {
    const result = await this._invoiceService.import(orderId, true);
    return this.getResponse(true, result);
  }

  @Post('invoices/resend/:orderId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send order invoice' })
  @ApiResponseDto({ type: Boolean })
  async sendInvoice(
    @UUIDParam('orderId') orderId: string,
    @Body() dto: SendInvoiceRequestDto,
  ): Promise<ResponseDto<boolean>> {
    const isSend = await this._invoiceService.resendInvoice(orderId, dto.email);
    return this.getResponse(true, isSend);
  }

  @Post('invoices/cancel/:orderId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel order invoice' })
  @ApiResponseDto({ type: Boolean })
  async cancelInvoice(
    @UUIDParam('orderId') orderId: string,
  ): Promise<ResponseDto<boolean>> {
    const isSend = await this._invoiceService.cancelInvoice(orderId);
    return this.getResponse(true, isSend);
  }

  // ! SUPPORT
  @Put('supports/:nflowGuid')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update customer support status' })
  @ApiResponseDto({ type: Boolean })
  async updateSupport(
    @Param('nflowGuid') nflowGuid: string,
    @Body() dto: UpdateSupportRequestDto,
  ): Promise<ResponseDto<boolean>> {
    const isUpdated = await this._supportService.update(nflowGuid, dto);
    return this.getResponse(true, isUpdated);
  }

  // ! STATION MODES
  @Post('station-modes')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update price for station mode' })
  @ApiResponseDto({ type: StationModeDto })
  async create(
    @Body() request: CreateStationModeDto,
  ): Promise<ResponseDto<StationModeDto>> {
    const result = await this._stationModeService.create(request);
    return this.getResponse(true, result);
  }

  // ! EXPORT
  @Get('referrals')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get referrals' })
  @ApiPageResponse({ type: ReferralDto })
  async getReferrals(
    @Query(new ValidationPipe({ transform: true }))
    query: PaginationRequestDto,
  ): Promise<ResponseDto<PaginationResponseDto<ReferralDto>>> {
    const result = await this._referralService.getReferrals(query);
    return this.getResponse(true, result);
  }

  @Get('referrals/export')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get export referrals excel' })
  @ApiResponseDto({ type: String })
  async exportReferrals(
    @Query() request: ExportReferralRequest,
  ): Promise<ResponseDto<string>> {
    const result = await this._exportService.exportReferrals(request);
    return this.getResponse(true, result);
  }

  @Post('refunds/send')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send the refund list to the accountants email' })
  @ApiResponseDto({ type: Boolean })
  async mailRefundList(
    @Body() request: ExportRefundRequest,
  ): Promise<ResponseDto<boolean>> {
    const isSuccess = await this._exportService.mailRefundList(request);
    return this.getResponse(true, isSuccess);
  }

  // ! PACKAGES
  @Post('packages')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sync package' })
  @ApiResponseDto({ type: Boolean })
  async updatePackage(@Body() dto: PackageDto): Promise<ResponseDto<boolean>> {
    const isSuccess = await this._packageService.syncPackages(dto);
    return this.getResponse(true, isSuccess);
  }

  @Delete('packages/:nflowGuid')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete package' })
  @ApiResponseDto({ type: Boolean })
  async deletePackage(
    @Param('nflowGuid') nflowGuid: string,
  ): Promise<ResponseDto<boolean>> {
    const isSuccess = await this._packageService.deletePackage(nflowGuid);
    return this.getResponse(true, isSuccess);
  }

  // ! SYNC
  @Post('sync/orders')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sync order by ids' })
  @ApiResponseDto({ type: Boolean })
  async syncOrders(
    @Body() req: NflowSyncOrderRequest,
  ): Promise<ResponseDto<boolean>> {
    await this._syncService.handleSync(req.orderIds, SyncTypeEnum.ORDER);
    return this.getResponse(true, true);
  }

  // ! FNB
  @Get('fnb/shops')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get FNB shops' })
  @ApiResponseDto({ type: Array<BBShopDto> })
  public async getShops(): Promise<ResponseDto<BBShopDto[]>> {
    const result = await this._biteboltService.getShops();
    return this.getResponse(true, result);
  }

  // ! CAMPAIGN
  @Post('campaigns')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Create a new campaign' })
  @ApiResponseDto({ type: NflowCampaignDto })
  async createCampaign(
    @Body() dto: NflowCampaignDto,
  ): Promise<ResponseDto<NotificationCampaignEntity>> {
    const result = await this._campaignService.createByNflow(dto);
    return this.getResponse(true, result);
  }

  @Put('campaigns')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update campaign' })
  @ApiResponseDto({ type: NotificationCampaignEntity })
  async updateCampaign(
    @Body() dto: UpdateNflowCampaignDto,
  ): Promise<ResponseDto<NotificationCampaignEntity>> {
    const result = await this._campaignService.update(dto);
    return this.getResponse(true, result);
  }

  @Put('campaigns/:id/deactivate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Deactivate campaign' })
  @ApiResponseDto({ type: Boolean })
  async deactivateCampaign(
    @UUIDParam('id') id: string,
  ): Promise<ResponseDto<boolean>> {
    const isSuccess = await this._campaignService.deactivate(id);
    return this.getResponse(true, isSuccess);
  }
}
