/* eslint-disable @typescript-eslint/naming-convention */
import { Injectable } from '@nestjs/common';
import { HttpStatusCode, Method } from 'axios';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import { v4 as uuidv4 } from 'uuid';

import { retry } from '../../../common/utils';
import { CACHE_KEY, SyncActionEnum } from '../../../constants';
import { AbstractAPIService } from '../../../shared/services/abstract-api.service';
import { ApiConfigService } from '../../../shared/services/api-config.service';
import { CacheService } from '../../../shared/services/cache.service';
import { LoggerService } from '../../../shared/services/logger.service';
import { B2bVoucherCodeDto } from '../../b2b-voucher/dtos/b2b-voucher-code.dto';
import { SyncPayloadDto } from '../../sync/dtos/sync-payload.dto';
import { SyncTypeEnum } from '../../sync/enums/sync-action.enum';
import { EventValidityDto } from '../../voucher/dtos/event-validity.dto';
import {
  NflowSearchFilter,
  NflowSearchRequest,
  NflowSearchRes,
} from '../dtos/nflow-search.dto';

dayjs.extend(utc);
dayjs.extend(timezone);

@Injectable()
export class NflowService extends AbstractAPIService {
  private renewalPromise: Promise<string> | null = null;

  static readonly VOUCHER = '/v1/d/vouchers';
  static readonly UPDATE_VOUCHER = '/v1/f/apiupdateVoucher';
  static readonly EVENT = '/v1/d/event';
  static readonly VOUCHER_CODE = '/v1/d/voucherCode';
  static readonly B2B_VOUCHER = '/v1/d/voucherB2B';

  constructor(
    private readonly _config: ApiConfigService,
    private readonly _logger: LoggerService,
    private readonly _cache: CacheService,
  ) {
    super();
  }

  protected getBaseUrl(): string {
    return this._config.nflow.baseUrl;
  }

  private async renewAccessToken(): Promise<string> {
    const body = {
      username: this._config.nflow.username,
      password: this._config.nflow.password,
      grant_type: 'password',
    };

    try {
      const res = await this.http.post<{
        access_token: string;
        expires_in: number;
      }>(this._config.nflow.keycloakUrl, body, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${this._config.nflow.clientId}`,
        },
      });

      const accessToken = res?.data?.access_token;
      const expiresIn = res?.data?.expires_in;

      if (!accessToken) {
        this._logger.error('Failed to get access token');
        return;
      }

      await this._cache.set(
        CACHE_KEY.NFLOW_ACCESS_TOKEN,
        accessToken,
        expiresIn,
      );

      return accessToken;
    } catch (error) {
      this._logger.error(error);
      return;
    } finally {
      this.renewalPromise = null; // Reset the renewal promise
    }
  }

  private async getAccessToken(): Promise<string> {
    const accessToken = await this._cache.get<string>(
      CACHE_KEY.NFLOW_ACCESS_TOKEN,
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
      'x-nc-tenant': 'wash24h',
    };
  }

  public async request<T>({
    method,
    path,
    data,
    retries = 5, // Number of retries
    delay = 1000, // Delay in milliseconds
  }: {
    method: Method;
    path: string;
    data?: Record<string, any>;
    retries?: number; // Optional parameter for retries
    delay?: number; // Optional parameter for delay
  }): Promise<T> {
    let headers = await this.buildAuthHeaders();

    const traceId = uuidv4();
    const url = this.makeUrl(path);

    const configLog = {
      method,
      url,
      headers: headers,
      body: data,
    };

    this._logger.info(
      `[NFLOW REQUEST] TraceId [${traceId}]: ${JSON.stringify(configLog)}`,
    );

    const handleRequest = async () => {
      try {
        const result = await this.http.request<T>(method, url, {
          headers,
          data,
        });

        this._logger.info(
          `[NFLOW RESPONSE] TraceId [${traceId}]: ${JSON.stringify(result?.data)}`,
        );

        return result?.data;
      } catch (error) {
        this._logger.info(`[NFLOW ERROR] TraceId [${traceId}]: ${error}`);
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

  private async executeAction<T>(
    method: Method,
    path: string,
    data: T,
    nflowId?: string,
  ): Promise<any> {
    switch (method) {
      case 'POST':
        return this.request({
          method,
          path,
          data: data,
        });
      case 'PUT':
        return this.request({
          method,
          path: `${path}/${nflowId}`,
          data: data,
        });
      case 'DELETE':
        return this.request({
          method,
          path: `${path}/${nflowId}`,
        });
      default:
        throw new Error(`Unsupported action: ${method}`);
    }
  }

  private getPath(type: SyncTypeEnum): string {
    const paths = {
      [SyncTypeEnum.VOUCHER]: NflowService.VOUCHER,
      [SyncTypeEnum.B2B_VOUCHER_CODE]: NflowService.VOUCHER_CODE,
    };

    const path = paths[type];

    if (!path) {
      throw new Error(`Unsupported type: ${type}`);
    }

    return path;
  }

  public async sync<T>({
    type,
    action,
    data,
    nflowId,
  }: SyncPayloadDto<T>): Promise<boolean | string> {
    if (!action || !data) return false;

    const path = this.getPath(type);
    this._logger.info(`[SYNC ${type}] action: ${action}, nflowId: ${nflowId}`);

    let method: Method;

    if (action === SyncActionEnum.Delete) {
      method = 'DELETE';
      if (!nflowId) return true;
    } else {
      method = nflowId ? 'PUT' : 'POST';
    }

    try {
      const res = await this.executeAction(method, path, data, nflowId);
      return res?.guid;
    } catch (error) {
      this._logger.error(`[SYNC ${type} FAILED] >>>`);
      this._logger.error(error);
      return false;
    }
  }

  public async search<T>(
    path: string,
    request?: NflowSearchRequest,
  ): Promise<T[]> {
    const total = await this.countObject(path, request?.filters);
    if (!total) return [];

    try {
      const res = await this.request<NflowSearchRes<T>>({
        method: 'POST',
        path: `${path}/search`,
        data: {
          ...request,
          offset: 0,
          limit: total,
        },
      });
      return res?.data || [];
    } catch (error) {
      this._logger.error(error);
      return [];
    }
  }

  public async getGuid(
    path: string,
    where: Record<string, string>,
  ): Promise<string> {
    try {
      const filters: NflowSearchFilter[][] = Object.entries(where).map(
        ([fieldName, value]) => [
          {
            fieldName,
            operator: '===',
            value,
          },
        ],
      );

      const fields = Object.keys(where);
      const res = await this.request<NflowSearchRes<{ guid: string }>>({
        method: 'POST',
        path: `${path}/search`,
        data: {
          filters: filters,
          searchFields: fields,
          select: [...fields, 'guid'],
          sortBy: 'createdAt',
          sortOrder: 'DESC',
          offset: 0,
          limit: 1,
        },
      });

      const objects = res?.data || [];
      return objects?.[0]?.guid;
    } catch (error) {
      this._logger.error(error);
      return null;
    }
  }

  public async getEvents(ids: string[]): Promise<EventValidityDto[]> {
    if (!ids?.length) return [];

    const filters: NflowSearchFilter[][] = ids.map((id) => {
      return [
        {
          fieldName: 'guid',
          operator: '===',
          value: id,
        },
      ];
    });

    try {
      const objects = await this.search<EventValidityDto>(NflowService.EVENT, {
        filters: filters,
        searchFields: ['guid'],
        select: Object.keys(new EventValidityDto()),
      });

      return (objects || []).map((obj) => ({
        guid: obj.guid,
        name: obj.name,
        description: obj.description,
        start: obj.start,
        end: obj.end,
      }));
    } catch (error) {
      this._logger.error(error);
      return [];
    }
  }

  public async countObject(
    object: string,
    filters?: NflowSearchFilter[][],
  ): Promise<number> {
    try {
      const res = await this.request<{ count: number }>({
        method: 'POST',
        path: `${object}/count`,
        data: { filters: filters || [] },
      });
      return Number(res?.count || 0);
    } catch (error) {
      this._logger.error(error);
      return 0;
    }
  }

  public async createB2bCodes(codes: B2bVoucherCodeDto[]): Promise<string[]> {
    return this.request({
      method: 'POST',
      path: '/v1/f/apiCreateMultiCode',
      data: { data: codes },
    });
  }

  public async recallB2bCodes(codeIds: string[]): Promise<string[]> {
    return this.request({
      method: 'POST',
      path: '/v1/f/apiRecallVoucher',
      data: { data: codeIds },
    });
  }
}
