/* eslint-disable @typescript-eslint/naming-convention */
import { BadRequestException, Injectable } from '@nestjs/common';
import { HttpStatusCode, Method } from 'axios';
import { v4 as uuidv4 } from 'uuid';

import { retry } from '../../../common/utils';
import { CACHE_KEY } from '../../../constants';
import { AbstractAPIService } from '../../../shared/services/abstract-api.service';
import { ApiConfigService } from '../../../shared/services/api-config.service';
import { CacheService } from '../../../shared/services/cache.service';
import { LoggerService } from '../../../shared/services/logger.service';
import { TranslationService } from '../../../shared/services/translation.service';
import {
  GPayQRGenerate,
  GPayQRSourcePaymentType,
  GPayQRType,
  UpdateGPayQRRequest,
} from '../dtos/gpay/gpay-qr-request';
import {
  GPayQRInfo,
  GPayQRResCode,
  GPayQRResponse,
} from '../dtos/gpay/gpay-qr-response';

@Injectable()
export class GpayQRService extends AbstractAPIService {
  private renewalPromise: Promise<string> | null = null;

  static readonly GENERATE = '/partner_qr/api/v1.0/generate';
  static readonly UPDATE = '/partner_qr/api/v1.0/update';
  static readonly ENQUIRY = '/partner_qr/api/v1.0/enquiry';

  constructor(
    private readonly _config: ApiConfigService,
    private readonly _logger: LoggerService,
    private readonly _cache: CacheService,
    private readonly _i18n: TranslationService,
  ) {
    super();
  }

  protected getBaseUrl(): string {
    return this._config.gpayQR.endpoint;
  }

  private async renewAccessToken(): Promise<string> {
    const token = `${this._config.gpayQR.clientId}:${this._config.gpayQR.clientSecret}`;
    const base64Token = Buffer.from(token).toString('base64');

    try {
      this._logger.info(
        `[GPAY QR LOGIN]: ${JSON.stringify({
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${base64Token}`,
        })}`,
      );

      const res = await this.http.post<{
        access_token: string;
        expires_in: number;
      }>(
        this._config.gpayQR.endpointAuth,
        { grant_type: 'client_credentials' },
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: `Basic ${base64Token}`,
          },
        },
      );

      this._logger.info(`[GPAY QR LOGIN RESPONSE]: ${res}`);

      const accessToken = res?.data?.access_token;
      const expiresIn = res?.data?.expires_in;

      if (!accessToken) {
        this._logger.error('Failed to get access token');
        return;
      }

      await this._cache.set(CACHE_KEY.QR_ACCESS_TOKEN, accessToken, expiresIn);

      return accessToken;
    } catch (error) {
      this._logger.error(`[GPAY QR LOGIN ERROR]: ${error}`);
      return;
    } finally {
      this.renewalPromise = null; // Reset the renewal promise
    }
  }

  private async getAccessToken(): Promise<string> {
    const accessToken = await this._cache.get<string>(
      CACHE_KEY.QR_ACCESS_TOKEN,
    );
    if (accessToken) return accessToken;

    if (this.renewalPromise) {
      // Token renewal is in progress, return the promise
      return this.renewalPromise;
    }

    // Initiate token renewal
    this.renewalPromise = this.renewAccessToken();
    return this.renewalPromise;
  }

  private async buildAuthHeaders(): Promise<Record<string, string>> {
    const accessToken = await this.getAccessToken();
    return {
      Authorization: `Bearer ${accessToken}`,
      'X-Request-ID': uuidv4(),
      'X-Request-Time': `${Date.now()}`,
    };
  }

  private async request<T>({
    method,
    path,
    data,
    retries = 3, // Number of retries
    delay = 1000, // Delay in milliseconds
  }: {
    method: Method;
    path: string;
    data?: Record<string, any>;
    retries?: number; // Optional parameter for retries
    delay?: number; // Optional parameter for delay
  }): Promise<T> {
    let headers = await this.buildAuthHeaders();

    const url = this.makeUrl(path);
    const traceId = uuidv4();

    const configLog = {
      method,
      url,
      headers: headers,
      body: data,
    };

    this._logger.info(
      `[GPAY QR REQUEST] TraceId [${traceId}]: ${JSON.stringify(configLog)}`,
    );

    const handleRequest = async () => {
      try {
        const result = await this.http.request<T>(method, url, {
          headers,
          data,
        });

        this._logger.info(
          `[GPAY QR RESPONSE] TraceId [${traceId}]: ${JSON.stringify(result?.data || {})}`,
        );

        return result?.data;
      } catch (error) {
        this._logger.info(`[GPAY QR ERROR] TraceId [${traceId}]: ${error}`);
        if (error?.response?.status === HttpStatusCode.Unauthorized) {
          await this.renewAccessToken();

          // Rebuild headers after renewing the token
          headers = await this.buildAuthHeaders();
        }
        throw error; // Rethrow if not an Unauthorized error
      }
    };

    return await retry(handleRequest.bind(this), retries, delay);
  }

  public async generateQR({
    deviceId,
  }: {
    deviceId: string;
  }): Promise<GPayQRInfo> {
    try {
      const req: GPayQRGenerate = {
        merchantId: this._config.gpayQR.merchantId,
        sourcePaymentType: GPayQRSourcePaymentType.QR_VA,
        accountName: this._config.gpayQR.accountName,
        qrType: GPayQRType.MANY_TIME,
        refNo: `${Date.now()}`,
        content: this._i18n.t('common.paymentQR'),
        callbackUrl: this._config.gpayQR.callbackEndpoint,
        amount: 0,
        expireAt: 99991231235959, /// 9999-12-31 23:59:59
        extraData: { deviceId },
        caller: this._config.gpayQR.caller,
      };

      const res = await this.request<GPayQRResponse<GPayQRInfo>>({
        method: 'POST',
        path: GpayQRService.GENERATE,
        data: req,
      });

      if (res?.resCode === GPayQRResCode.SUCCESS) {
        return res?.resData;
      }

      return null;
    } catch (error) {
      this._logger.error(error);
      throw new BadRequestException(error);
    }
  }

  public async updateQR(req: UpdateGPayQRRequest): Promise<boolean> {
    try {
      const res = await this.request<GPayQRResponse<unknown>>({
        method: 'PUT',
        path: GpayQRService.UPDATE,
        data: req,
      });

      return res?.resCode === GPayQRResCode.SUCCESS;
    } catch (error) {
      this._logger.error(error);
      throw new BadRequestException(error);
    }
  }

  public async enquiryQR(accountNo: string): Promise<GPayQRInfo> {
    try {
      const res = await this.request<GPayQRResponse<GPayQRInfo>>({
        method: 'GET',
        path: `${GpayQRService.ENQUIRY}?accountNo=${accountNo}`,
      });

      return res?.resData;
    } catch (error) {
      this._logger.error(error);
      throw new BadRequestException(error);
    }
  }
}
