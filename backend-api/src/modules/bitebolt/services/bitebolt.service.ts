import { BadRequestException, Injectable } from '@nestjs/common';
import { AxiosRequestConfig, Method } from 'axios';
import { plainToInstance } from 'class-transformer';
import { uniqBy } from 'lodash';

import { ResponseDto } from '../../../common/dto/response.dto';
import { AbstractAPIService } from '../../../shared/services/abstract-api.service';
import { ApiConfigService } from '../../../shared/services/api-config.service';
import { LoggerService } from '../../../shared/services/logger.service';
import { BBCategoryDto, BBCategoryProductDto } from '../dtos/bb-category.dto';
import { BBGeneralSettingDto } from '../dtos/bb-general-setting.dto';
import { BBOrderDto } from '../dtos/bb-order.dto';
import { BBProductDto } from '../dtos/bb-product.dto';
import { BBShopDto } from '../dtos/bb-shop.dto';
import { BBGetPublicProducts } from '../dtos/requests/bb-get-product.request.dto';
import {
  BBCreateOrderRequest,
  BBPaymentOrderRequest,
  BBPlaceOrderRequest,
} from '../dtos/requests/bb-order.request.dto';
import { BBPlaceOrderResponseDto } from '../dtos/responses/bb-order.response.dto';
import { BBPaymentResponseDto } from '../dtos/responses/bb-payment.response.dto';
import { BBItemVisibilityEnum, BBProductTypeEnum } from '../enums/bb.enum';
import { BBUtils } from './bitebolt-utils';

@Injectable()
export class BiteboltService extends AbstractAPIService {
  constructor(
    private readonly _config: ApiConfigService,
    private readonly _logger: LoggerService,
  ) {
    super();
  }

  protected getBaseUrl(): string {
    return `${this._config.bitebolt.baseUrl}/api`;
  }

  // ! General
  public async getShops(): Promise<BBShopDto[]> {
    const response = await this.request<ResponseDto<BBShopDto[]>>(
      'GET',
      '/v1/public/shops',
    );
    return response?.data;
  }

  public async getGeneralSetting(): Promise<BBGeneralSettingDto> {
    const response = await this.request<ResponseDto<BBGeneralSettingDto>>(
      'GET',
      '/v1/public/setting',
    );
    return response?.data;
  }

  // ! Catalog
  public async getCategories(shopId: string): Promise<BBCategoryDto[]> {
    const response = await this.request<ResponseDto<BBCategoryDto[]>>(
      'GET',
      `/v1/public/category`,
      { params: { shopId } },
    );
    return response?.data;
  }

  public async getProducts(
    query: BBGetPublicProducts,
  ): Promise<BBProductDto[]> {
    const response = await this.request<ResponseDto<BBCategoryProductDto[]>>(
      'GET',
      `/v1/public/products`,
      { params: query },
    );

    const products = this.filterCategoryProducts(response?.data || [], query);
    return BBUtils.formatPrices<BBProductDto[]>(
      plainToInstance(BBProductDto, products),
    );
  }

  // ! Order
  public async createOrder(dto: BBCreateOrderRequest): Promise<BBOrderDto> {
    const request = BBUtils.formatPrices<BBCreateOrderRequest>(
      plainToInstance(BBCreateOrderRequest, dto),
      true,
    );
    const response = await this.request<ResponseDto<BBOrderDto>>(
      'POST',
      '/v1/orders/create',
      { data: request },
    );
    return response?.data;
  }

  public async updateOrderItems(
    dto: BBCreateOrderRequest,
  ): Promise<BBOrderDto> {
    const request = BBUtils.formatPrices<BBCreateOrderRequest>(
      plainToInstance(BBCreateOrderRequest, dto),
      true,
    );
    const response = await this.request<ResponseDto<BBOrderDto>>(
      'PUT',
      '/v1/orders/update-order-items',
      { data: request },
    );
    return response?.data;
  }

  public async placeOrder(
    dto: BBPlaceOrderRequest,
  ): Promise<BBPlaceOrderResponseDto> {
    const request = BBUtils.formatPrices<BBPlaceOrderRequest>(
      plainToInstance(BBPlaceOrderRequest, dto),
      true,
    );
    const response = await this.request<ResponseDto<BBPlaceOrderResponseDto>>(
      'POST',
      '/v1/orders/place-order',
      { data: request },
    );
    return response?.data;
  }

  public async paymentOrder(
    dto: BBPaymentOrderRequest,
  ): Promise<BBPaymentResponseDto> {
    const request = BBUtils.formatPrices<BBPaymentOrderRequest>(
      plainToInstance(BBPaymentOrderRequest, dto),
      true,
    );
    const response = await this.request<ResponseDto<BBPaymentResponseDto>>(
      'PUT',
      '/v1/orders/payment',
      { data: request },
    );
    return response?.data;
  }

  public async getOrder(id: string): Promise<BBOrderDto> {
    const response = await this.request<ResponseDto<BBOrderDto>>(
      'GET',
      `/v1/orders/${id}`,
    );

    const order = response?.data;
    if (!order) return null;

    return BBUtils.formatPrices<BBOrderDto>(plainToInstance(BBOrderDto, order));
  }

  // ! Private
  private async request<T>(
    method: Method,
    path: string,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    try {
      this._logger.info(
        `[Bitebolt Request]: ${method} ${path} ${JSON.stringify(config)}`,
      );

      const url = this.makeUrl(path);
      const axiosConfig: AxiosRequestConfig = {
        headers: {
          // Authorization: `Bearer ${this._config.bitebolt.token}`,
          ['x-tenant-host']: this._config.bitebolt.tenantHost,
          ['x-payment-key']: this._config.bitebolt.paymentKey,
        },
        ...config,
      };

      const res = await this.http.request<T>(method, url, axiosConfig);
      return res?.data;
    } catch (error) {
      this._logger.error('[Bitebolt Error]>>>>>>>>>');
      this._logger.error(error?.response?.data || error);
      throw new BadRequestException(error?.response?.data?.response || error);
    }
  }

  private filterCategoryProducts(
    categories: BBCategoryProductDto[] = [],
    query: BBGetPublicProducts,
  ): BBProductDto[] {
    const filteredCategories = categories.map((category) => ({
      ...category,
      products: category.products.filter((p) => this.validateProduct(p)),
    }));

    const products = uniqBy(
      (filteredCategories || []).flatMap((c) => c.products),
      'id',
    );

    const filteredProducts = products.filter((p) => {
      const price = BBUtils.toPrice(p.price);

      if (query.fromPrice && price < query.fromPrice) return false;
      if (query.toPrice && price > query.toPrice) return false;

      return true;
    });

    return filteredProducts.map((p) => {
      const validDiscount = BBUtils.getValidDiscount(p.discounts);
      return {
        ...p,
        discountPrice: validDiscount?.price,
      };
    });
  }

  private validateProduct(product: BBProductDto): boolean {
    const isVisible = product.visibility === BBItemVisibilityEnum.VISIBLE;
    const isNotExpired = !product.isExpired;
    const isSimple = [
      BBProductTypeEnum.PRODUCT,
      BBProductTypeEnum.SIMPLE,
    ].includes(product.type);
    const isEmptyOptions = !product.productOptionTypes?.length;
    const isEmptySizes = !product.productSizes?.length;
    const isEmptyLinkedGroups = !product.linkedProductGroups?.length;

    return (
      isVisible &&
      isNotExpired &&
      isSimple &&
      isEmptyOptions &&
      isEmptySizes &&
      isEmptyLinkedGroups
    );
  }
}
