import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  ValidationPipe,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { BaseController } from '../../../common/controllers/base.controller';
import { PaginationRequestDto } from '../../../common/dto/pagination-request.dto';
import { PaginationResponseDto } from '../../../common/dto/pagination-response.dto';
import { ResponseDto } from '../../../common/dto/response.dto';
import { Auth, UUIDParam } from '../../../decorators';
import {
  ApiPageResponse,
  ApiResponseDto,
} from '../../../decorators/api-response';
import { Role } from '../../role-permission/enums/roles.enum';
import { MachineInfoDto } from '../../yigoli/dtos/machine-info.dto';
import { DeviceAndModeDto, DeviceDto } from '../dtos/device.dto';
import { DeviceService } from '../services/device.service';

@Controller({
  path: 'devices',
  version: '1',
})
@ApiTags('Devices')
export class DeviceController extends BaseController {
  constructor(private readonly _deviceService: DeviceService) {
    super();
  }

  @Get()
  @Auth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get devices list' })
  @ApiPageResponse({ type: DeviceDto })
  async getDevices(
    @Query(new ValidationPipe({ transform: true }))
    query: PaginationRequestDto,
  ): Promise<ResponseDto<PaginationResponseDto<DeviceDto>>> {
    const result = await this._deviceService.getDevices(query);
    return this.getResponse(true, result);
  }

  @Get(':id')
  @Auth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get device by id' })
  @ApiResponseDto({ type: DeviceAndModeDto })
  async getDevice(
    @Param('id') id: string,
  ): Promise<ResponseDto<DeviceAndModeDto>> {
    const result = await this._deviceService.getDevice(id);
    return this.getResponse(true, result);
  }

  @Get('station/:stationId')
  @Auth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get devices by station' })
  @ApiResponseDto({ type: Array<DeviceDto> })
  async getDeviceByStation(
    @UUIDParam('stationId') stationId: string,
  ): Promise<ResponseDto<DeviceDto[]>> {
    const result = await this._deviceService.getDevicesByStation([stationId]);
    return this.getResponse(true, result);
  }

  @Get('status/:id')
  @Auth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get device status' })
  @ApiResponseDto({ type: DeviceDto })
  async getDeviceStatus(
    @Param('id') id: string,
  ): Promise<ResponseDto<MachineInfoDto>> {
    const result = await this._deviceService.getDeviceStatus(id);
    return this.getResponse(true, result);
  }

  @Post('generate-qr')
  @Auth({ roles: [Role.SA] })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate QR' })
  @ApiResponseDto({ type: Boolean })
  async generateQR(): Promise<ResponseDto<boolean>> {
    const isSuccess = await this._deviceService.generateQRAllDevices();
    return this.getResponse(true, isSuccess);
  }

  @Post('generate-qr/:id')
  @Auth({ roles: [Role.SA] })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate QR by id' })
  @ApiResponseDto({ type: Boolean })
  async generateQRById(
    @UUIDParam('id') id: string,
  ): Promise<ResponseDto<boolean>> {
    const isSuccess = await this._deviceService.generateQRById(id);
    return this.getResponse(true, isSuccess);
  }
}
