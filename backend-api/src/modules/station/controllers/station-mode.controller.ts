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
import { PaginationResponseDto } from '../../../common/dto/pagination-response.dto';
import { ResponseDto } from '../../../common/dto/response.dto';
import { Auth, Roles, UUIDParam } from '../../../decorators';
import {
  ApiPageResponse,
  ApiResponseDto,
} from '../../../decorators/api-response';
import { Role } from '../../role-permission/enums/roles.enum';
import { CreateStationModeDto, StationModeDto } from '../dtos/station-mode.dto';
import { StationModeService } from '../services/station-mode.service';

@Controller({
  path: 'station-modes',
  version: '1',
})
@ApiTags('Station modes')
@Auth()
export class StationModeController extends BaseController {
  constructor(private readonly _stationModeService: StationModeService) {
    super();
  }

  @Post()
  @Roles(Role.SA)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Create a new station mode' })
  @ApiResponseDto({ type: StationModeDto })
  async create(
    @Body() request: CreateStationModeDto,
  ): Promise<ResponseDto<StationModeDto>> {
    const result = await this._stationModeService.create(request);
    return this.getResponse(true, result);
  }

  @Put()
  @Roles(Role.SA)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update station mode' })
  @ApiResponseDto({ type: Boolean })
  async update(@Body() request: StationModeDto): Promise<ResponseDto<boolean>> {
    const isUpdated = await this._stationModeService.update(request);
    return this.getResponse(true, isUpdated);
  }

  @Delete(':id')
  @Roles(Role.SA)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete station mode' })
  @ApiResponseDto({ type: Boolean })
  async delete(@UUIDParam('id') id: string): Promise<ResponseDto<boolean>> {
    const isUpdated = await this._stationModeService.delete(id);
    return this.getResponse(true, isUpdated);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get station modes list' })
  @ApiPageResponse({ type: StationModeDto })
  async getStationModes(
    @Query(new ValidationPipe({ transform: true }))
    query: PaginationRequestDto,
  ): Promise<ResponseDto<PaginationResponseDto<StationModeDto>>> {
    const result = await this._stationModeService.getStationModes(query);
    return this.getResponse(true, result);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get station mode by id' })
  @ApiResponseDto({ type: StationModeDto })
  async get(
    @UUIDParam('id') mode: string,
  ): Promise<ResponseDto<StationModeDto>> {
    const result = await this._stationModeService.getStationMode(mode);
    return this.getResponse(true, result);
  }
}
