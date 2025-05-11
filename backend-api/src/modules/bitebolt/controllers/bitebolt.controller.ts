import { Controller, Get, HttpCode, HttpStatus, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { BaseController } from '../../../common/controllers/base.controller';
import { ResponseDto } from '../../../common/dto/response.dto';
import { Auth, UUIDParam } from '../../../decorators';
import { ApiResponseDto } from '../../../decorators/api-response';
import { BBCategoryDto } from '../dtos/bb-category.dto';
import { BBGeneralSettingDto } from '../dtos/bb-general-setting.dto';
import { BBOrderDto } from '../dtos/bb-order.dto';
import { BBProductDto } from '../dtos/bb-product.dto';
import { BBShopDto } from '../dtos/bb-shop.dto';
import { BBGetPublicProducts } from '../dtos/requests/bb-get-product.request.dto';
import { BiteboltService } from '../services/bitebolt.service';

@Controller({
  path: 'fnb',
  version: '1',
})
@ApiTags('FNB')
@Auth()
export class BiteboltController extends BaseController {
  constructor(private readonly _biteboltService: BiteboltService) {
    super();
  }

  @Get('shops')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get FNB shops' })
  @ApiResponseDto({ type: Array<BBShopDto> })
  public async getShops(): Promise<ResponseDto<BBShopDto[]>> {
    const result = await this._biteboltService.getShops();
    return this.getResponse(true, result);
  }

  @Get('general-setting')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get FNB general setting' })
  @ApiResponseDto({ type: BBGeneralSettingDto })
  public async getGeneralSetting(): Promise<ResponseDto<BBGeneralSettingDto>> {
    const result = await this._biteboltService.getGeneralSetting();
    return this.getResponse(true, result);
  }

  @Get('categories')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get FNB categories' })
  @ApiResponseDto({ type: Array<BBCategoryDto> })
  public async getCategories(
    @Query('shopId') shopId: string,
  ): Promise<ResponseDto<BBCategoryDto[]>> {
    const result = await this._biteboltService.getCategories(shopId);
    return this.getResponse(true, result);
  }

  @Get('products')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get FNB products' })
  @ApiResponseDto({ type: Array<BBProductDto> })
  public async getProducts(
    @Query() query: BBGetPublicProducts,
  ): Promise<ResponseDto<BBProductDto[]>> {
    const result = await this._biteboltService.getProducts(query);
    return this.getResponse(true, result);
  }

  @Get('orders/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get FNB orders' })
  @ApiResponseDto({ type: BBOrderDto })
  public async getOrder(
    @UUIDParam('id') id: string,
  ): Promise<ResponseDto<BBOrderDto>> {
    const result = await this._biteboltService.getOrder(id);
    return this.getResponse(true, result);
  }
}
