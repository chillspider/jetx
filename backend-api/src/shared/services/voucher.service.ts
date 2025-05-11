import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import dayjs from 'dayjs';

import { PaginationResponseDto } from '../../common/dto/pagination-response.dto';
import { ResponseDto } from '../../common/dto/response.dto';
import { generateSignature, getUtcNow } from '../../common/utils';
import { CreateVoucherDto } from '../../modules/order/dtos/create-voucher.dto';
import {
  EventValidityDto,
  VoucherDto,
  VoucherMetadataDto,
} from '../../modules/order/dtos/voucher.dto';
import {
  VoucherIssueTypeEnum,
  VoucherModelEnum,
  VoucherProfileApplicationEnum,
  VoucherStatusEnum,
  VoucherTypeEnum,
} from '../../modules/order/enums/vouchers.enum';
import { UserEntity } from '../../modules/user/entities/user.entity';
import { AbstractAPIService } from './abstract-api.service';
import { ApiConfigService } from './api-config.service';
import { LoggerService } from './logger.service';
import { TranslationService } from './translation.service';

@Injectable()
export class VoucherService extends AbstractAPIService {
  constructor(
    @Inject(REQUEST) private readonly _request: any,
    private readonly _config: ApiConfigService,
    private readonly _i18n: TranslationService,
    private readonly _logger: LoggerService,
  ) {
    super();
  }

  protected getBaseUrl(): string {
    return this._config.voucher.url;
  }

  public async getVoucher(id: string): Promise<VoucherDto> {
    const authorizations = this._request?.headers?.authorization;

    if (!authorizations) {
      throw new ForbiddenException();
    }

    const response = await this.http.get<ResponseDto<VoucherDto>>(
      this.makeUrl(`/api/v1/vouchers/${id}`),
      {
        headers: { Authorization: authorizations },
      },
    );
    return response?.data?.data;
  }

  public async useVoucher(
    id: string,
    orderId: string,
    data?: VoucherMetadataDto,
  ): Promise<boolean> {
    try {
      const authorizations = this._request?.headers?.authorization;

      const response = await this.http.put<ResponseDto<boolean>>(
        this.makeUrl(`/api/v1/vouchers/me/use/${id}`),
        {
          orderId,
          data,
        },
        {
          headers: {
            Authorization: authorizations,
          },
        },
      );
      return response?.data?.data;
    } catch (error) {
      this._logger.error(error);
      return false;
    }
  }

  public async createVoucher(voucher: CreateVoucherDto): Promise<VoucherDto> {
    const signature = generateSignature(
      JSON.stringify(voucher),
      this._config.voucher.salt,
    );

    const response = await this.http.post<ResponseDto<VoucherDto>>(
      this.makeUrl(`/api/v1/vouchers`),
      voucher,
      {
        headers: { signature: signature },
      },
    );
    return response?.data?.data;
  }

  public async createBulkVouchers(
    vouchers: CreateVoucherDto[],
  ): Promise<VoucherDto[]> {
    const body = { vouchers: vouchers };

    const signature = generateSignature(
      JSON.stringify(body),
      this._config.voucher.salt,
    );

    const response = await this.http.post<ResponseDto<VoucherDto[]>>(
      this.makeUrl(`/api/v1/vouchers/bulk`),
      body,
      {
        headers: { signature: signature },
      },
    );
    return response?.data?.data;
  }

  public async rollbackVoucher(id: string): Promise<boolean> {
    try {
      const body = { id: id };

      const signature = generateSignature(
        JSON.stringify(body),
        this._config.voucher.salt,
      );

      const response = await this.http.post<ResponseDto<boolean>>(
        this.makeUrl(`/api/v1/vouchers/rollback`),
        body,
        {
          headers: { signature: signature },
        },
      );
      return response?.data?.data;
    } catch (error) {
      this._logger.error(error);
      return false;
    }
  }

  public async createFreeWashVoucher(
    user: UserEntity,
    excludeTimes: EventValidityDto[] = [],
  ): Promise<VoucherDto> {
    try {
      const voucher: CreateVoucherDto = {
        name: this._i18n.t('common.voucher.freeDeluxe'),
        description: this._i18n.t('common.voucher.freeDeluxeDesc'),
        type: VoucherTypeEnum.WASHING_SERVICE,
        profileApplication: VoucherProfileApplicationEnum.WASHING_SERVICE,
        voucherModel: VoucherModelEnum.PERCENTAGE,
        minOrderValue: 10000,
        maxDeductionValue: 69000,
        hiddenCashValue: 69000,
        percentage: 100,
        startAt: getUtcNow(),
        endAt: dayjs(getUtcNow()).add(6, 'month').toDate(),
        location: {
          stationIds: [],
          deviceIds: [],
          isExcluded: false,
        },
        status: VoucherStatusEnum.AVAILABLE,
        userId: user.id,
        email: user.email,
        excludeTime: excludeTimes,
        issueType: VoucherIssueTypeEnum.FREE,
      };

      return this.createVoucher(voucher);
    } catch (error) {
      this._logger.error(error);
      return null;
    }
  }

  public async getUserVouchers(orderValue?: number): Promise<VoucherDto[]> {
    const authorizations = this._request?.headers?.authorization;

    if (!authorizations) {
      throw new ForbiddenException();
    }

    const queryParams = {
      takeAll: true,
      isShowExpiredVouchers: false,
      orderValue: orderValue,
    };

    const response = await this.http.get<
      ResponseDto<PaginationResponseDto<VoucherDto>>
    >(this.makeUrl(`/api/v1/vouchers/me`), {
      headers: { Authorization: authorizations },
      params: queryParams,
    });

    return response?.data?.data?.data || [];
  }
}
