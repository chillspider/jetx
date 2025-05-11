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
import { ProductDto } from '../dtos/product.dto';
import {
  CreateProductDto,
  UpdateProductDto,
} from '../dtos/requests/create-product.dto';
import { ProductService } from '../services/product.service';

@Controller({
  path: 'products',
  version: '1',
})
@ApiTags('Products')
@Auth()
export class ProductController extends BaseController {
  constructor(private _productService: ProductService) {
    super();
  }

  @Post()
  @Roles(Role.SA)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Create a new product' })
  @ApiResponseDto({ type: ProductDto })
  async createProduct(
    @Body() request: CreateProductDto,
  ): Promise<ResponseDto<ProductDto>> {
    const result = await this._productService.create(request);
    return this.getResponse(true, result);
  }

  @Put()
  @Roles(Role.SA)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update product' })
  @ApiResponseDto({ type: Boolean })
  async updateProduct(
    @Body() request: UpdateProductDto,
  ): Promise<ResponseDto<boolean>> {
    const isUpdated = await this._productService.update(request);
    return this.getResponse(true, isUpdated);
  }

  @Delete(':id')
  @Roles(Role.SA)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete product' })
  @ApiResponseDto({ type: Boolean })
  async deleteProduct(
    @UUIDParam('id') id: string,
  ): Promise<ResponseDto<boolean>> {
    const isUpdated = await this._productService.delete(id);
    return this.getResponse(true, isUpdated);
  }

  @Get()
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

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get product detail' })
  @ApiResponseDto({ type: ProductDto })
  async getProduct(
    @UUIDParam('id') productId: string,
  ): Promise<ResponseDto<ProductDto>> {
    const result: ProductDto = await this._productService.getProduct(productId);
    return this.getResponse(true, result);
  }
}
