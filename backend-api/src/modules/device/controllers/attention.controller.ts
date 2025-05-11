import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Put,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { BaseController } from '../../../common/controllers/base.controller';
import { ResponseDto } from '../../../common/dto/response.dto';
import { Auth, Roles, UUIDParam } from '../../../decorators';
import { ApiResponseDto } from '../../../decorators/api-response';
import { Role } from '../../role-permission/enums/roles.enum';
import { AttentionDto } from '../dtos/attention.dto';
import {
  CreateAttentionDto,
  UpdateAttentionDto,
} from '../dtos/requests/create-attention.dto';
import { AttentionService } from '../services/attention.service';

@Controller({
  path: 'attentions',
  version: '1',
})
@ApiTags('Attentions')
@Auth()
export class AttentionController extends BaseController {
  constructor(private readonly _attentionService: AttentionService) {
    super();
  }

  @Post()
  @Roles(Role.SA)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Create a new attention' })
  @ApiResponseDto({ type: AttentionDto })
  async createAttention(
    @Body() dto: CreateAttentionDto,
  ): Promise<ResponseDto<AttentionDto>> {
    const result = await this._attentionService.create(dto);
    return this.getResponse(true, result);
  }

  @Put()
  @Roles(Role.SA)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update attention' })
  @ApiResponseDto({ type: Boolean })
  async updateAttention(
    @Body() dto: UpdateAttentionDto,
  ): Promise<ResponseDto<boolean>> {
    const isUpdated = await this._attentionService.update(dto);
    return this.getResponse(true, isUpdated);
  }

  @Delete(':id')
  @Roles(Role.SA)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete attention' })
  @ApiResponseDto({ type: Boolean })
  async deleteAttention(
    @UUIDParam('id') id: string,
  ): Promise<ResponseDto<boolean>> {
    const isDeleted = await this._attentionService.delete(id);
    return this.getResponse(true, isDeleted);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get attentions' })
  @ApiResponseDto({ type: Array<AttentionDto> })
  async getAttentions(): Promise<ResponseDto<AttentionDto[]>> {
    const result = await this._attentionService.getAttentions();
    return this.getResponse(true, result);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get attention by id' })
  @ApiResponseDto({ type: AttentionDto })
  async getAttention(
    @UUIDParam('id') id: string,
  ): Promise<ResponseDto<AttentionDto>> {
    const result = await this._attentionService.getAttention(id);
    return this.getResponse(true, result);
  }
}
