import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
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
import { CreateSupportRequestDto } from '../dtos/requests/create-support.request.dto';
import { SupportDto } from '../dtos/support.dto';
import { SupportService } from '../services/support.service';

@Controller({
  path: 'supports',
  version: '1',
})
@ApiTags('Supports')
@Auth()
export class SupportController extends BaseController {
  constructor(private readonly _supportService: SupportService) {
    super();
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Create support ticket' })
  @ApiResponseDto({ type: Boolean })
  @ApiFile({ name: 'images', isArray: true, maxCount: 5 })
  public async createSupport(
    @Body() dto: CreateSupportRequestDto,
    @UploadedFiles() images: Express.Multer.File[],
  ): Promise<ResponseDto<boolean>> {
    const isCreated = await this._supportService.create(dto, images);
    return this.getResponse(isCreated, isCreated);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get supports list' })
  @ApiPageResponse({ type: SupportDto })
  async getUsers(
    @Query(new ValidationPipe({ transform: true }))
    query: PaginationRequestDto,
  ): Promise<ResponseDto<PaginationResponseDto<SupportDto>>> {
    const result = await this._supportService.getSupports(query);
    return this.getResponse(true, result);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get support detail' })
  @ApiResponseDto({ type: SupportDto })
  async getUser(@UUIDParam('id') id: string): Promise<ResponseDto<SupportDto>> {
    const result = await this._supportService.getSupport(id);
    return this.getResponse(true, result);
  }
}
