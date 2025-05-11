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
import { CategoryDto } from '../dtos/category.dto';
import {
  CreateCategoryDto,
  UpdateCategoryDto,
} from '../dtos/requests/create-category.dto';
import { CategoryService } from '../services/category.service';

@Controller({
  path: 'categories',
  version: '1',
})
@ApiTags('Categories')
@Auth()
export class CategoryController extends BaseController {
  constructor(private _categoryService: CategoryService) {
    super();
  }

  @Post()
  @Roles(Role.SA)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Create a new category' })
  @ApiResponseDto({ type: CategoryDto })
  async createCategory(
    @Body() request: CreateCategoryDto,
  ): Promise<ResponseDto<CategoryDto>> {
    const result = await this._categoryService.create(request);
    return this.getResponse(true, result);
  }

  @Put()
  @Roles(Role.SA)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update category' })
  @ApiResponseDto({ type: Boolean })
  async updateCategory(
    @Body() request: UpdateCategoryDto,
  ): Promise<ResponseDto<boolean>> {
    const isUpdated = await this._categoryService.update(request);
    return this.getResponse(true, isUpdated);
  }

  @Delete(':id')
  @Roles(Role.SA)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete category' })
  @ApiResponseDto({ type: Boolean })
  async deleteCategory(
    @UUIDParam('id') id: string,
  ): Promise<ResponseDto<boolean>> {
    const isUpdated = await this._categoryService.delete(id);
    return this.getResponse(true, isUpdated);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get categories list' })
  @ApiPageResponse({ type: CategoryDto })
  async getCategories(
    @Query(new ValidationPipe({ transform: true }))
    query: PaginationRequestDto,
  ): Promise<ResponseDto<PaginationResponseDto<CategoryDto>>> {
    const result: PaginationResponseDto<CategoryDto> =
      await this._categoryService.getCategories(query);
    return this.getResponse(true, result);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get category by id' })
  @ApiResponseDto({ type: CategoryDto })
  async getCategory(
    @UUIDParam('id') categoryId: string,
  ): Promise<ResponseDto<CategoryDto>> {
    const result: CategoryDto =
      await this._categoryService.getCategory(categoryId);
    return this.getResponse(true, result);
  }
}
