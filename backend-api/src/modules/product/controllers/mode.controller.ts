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
import { PaginationResponseDto } from '../../../common/dto/pagination-response.dto';
import { ResponseDto } from '../../../common/dto/response.dto';
import { Auth, Roles, UUIDParam } from '../../../decorators';
import {
  ApiPageResponse,
  ApiResponseDto,
} from '../../../decorators/api-response';
import { Role } from '../../role-permission/enums/roles.enum';
import { ModeDto } from '../dtos/mode.dto';
import { CreateModeDto, UpdateModeDto } from '../dtos/requests/create-mode-dto';
import { ModePaginationRequestDto } from '../dtos/requests/mode-pagination.dto';
import { ModeService } from '../services/mode.service';

@Controller({
  path: 'modes',
  version: '1',
})
@ApiTags('Modes')
@Auth()
export class ModeController extends BaseController {
  constructor(private _modeService: ModeService) {
    super();
  }

  @Post()
  @Roles(Role.SA)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Create a new mode' })
  @ApiResponseDto({ type: ModeDto })
  async create(@Body() request: CreateModeDto): Promise<ResponseDto<ModeDto>> {
    const result = await this._modeService.create(request);
    return this.getResponse(true, result);
  }

  @Put()
  @Roles(Role.SA)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update mode' })
  @ApiResponseDto({ type: Boolean })
  async update(@Body() request: UpdateModeDto): Promise<ResponseDto<boolean>> {
    const isUpdated = await this._modeService.update(request);
    return this.getResponse(true, isUpdated);
  }

  @Delete(':id')
  @Roles(Role.SA)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete mode' })
  @ApiResponseDto({ type: Boolean })
  async delete(@UUIDParam('id') id: string): Promise<ResponseDto<boolean>> {
    const isUpdated = await this._modeService.delete(id);
    return this.getResponse(true, isUpdated);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get modes list' })
  @ApiPageResponse({ type: ModeDto })
  async getModes(
    @Query(new ValidationPipe({ transform: true }))
    query: ModePaginationRequestDto,
  ): Promise<ResponseDto<PaginationResponseDto<ModeDto>>> {
    const result = await this._modeService.getModes(query);
    return this.getResponse(true, result);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get mode by id' })
  @ApiResponseDto({ type: ModeDto })
  async get(@UUIDParam('id') mode: string): Promise<ResponseDto<ModeDto>> {
    const result = await this._modeService.getMode(mode);
    return this.getResponse(true, result);
  }
}
