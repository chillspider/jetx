import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { BaseController } from '../../../common/controllers/base.controller';
import { ResponseDto } from '../../../common/dto/response.dto';
import { getUtcNow } from '../../../common/utils';
import { Auth } from '../../../decorators';
import { ApiResponseDto } from '../../../decorators/api-response';
import { Role } from '../../role-permission/enums/roles.enum';
import { SettingDto } from '../dtos/setting.dto';
import { VoucherExcludedReasonDto } from '../dtos/voucher-excluded-reason.dto';
import { SettingService } from '../services/setting.service';

@Controller({
  path: 'settings',
  version: '1',
})
@ApiTags('Settings')
export class SettingController extends BaseController {
  constructor(private readonly _settingService: SettingService) {
    super();
  }

  @Post()
  @Auth({ roles: [Role.SA] })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update setting' })
  @ApiResponseDto({ type: SettingDto })
  async update(@Body() dto: SettingDto): Promise<ResponseDto<SettingDto>> {
    const result = await this._settingService.update(dto);
    return this.getResponse(true, result);
  }

  @Get()
  @Auth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get settings' })
  @ApiResponseDto({ type: Array<SettingDto> })
  async get(): Promise<ResponseDto<SettingDto[]>> {
    const result = await this._settingService.getSettings();
    return this.getResponse(true, result);
  }

  @Get('server-time')
  @Auth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get server time' })
  @ApiResponseDto({ type: Date })
  async getServerTime(): Promise<ResponseDto<Date>> {
    return this.getResponse(true, getUtcNow());
  }

  @Get('voucher-excluded-reason')
  @Auth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get voucher excluded reason' })
  @ApiResponseDto({ type: VoucherExcludedReasonDto })
  async getVoucherExcludedReason(): Promise<
    ResponseDto<VoucherExcludedReasonDto>
  > {
    const result = await this._settingService.getVoucherExcludedReason();
    return this.getResponse(true, result);
  }
}
