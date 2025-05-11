/* eslint-disable @typescript-eslint/naming-convention */
import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { HttpStatusCode, Method } from 'axios';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import { DataSource } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

import { getUtcNow, retry } from '../../../common/utils';
import { CACHE_KEY, EVENT } from '../../../constants';
import { SyncActionEnum } from '../../../constants/action';
import { DEFAULT_TIMEZONE } from '../../../constants/config';
import { AbstractAPIService } from '../../../shared/services/abstract-api.service';
import { ApiConfigService } from '../../../shared/services/api-config.service';
import { CacheService } from '../../../shared/services/cache.service';
import { LoggerService } from '../../../shared/services/logger.service';
import { TranslationService } from '../../../shared/services/translation.service';
import { EventValidityDto } from '../../order/dtos/voucher.dto';
import { OrderEntity } from '../../order/entities/order.entity';
import { OrderStatusEnum } from '../../order/enums/order-status.enum';
import { OrderTypeEnum } from '../../order/enums/order-type.enum';
import { SyncLogDto } from '../../sync/dtos/sync-log.dto';
import { SyncPayloadDto } from '../../sync/dtos/sync-payload.dto';
import { SyncLogEntity } from '../../sync/entities/sync-log.entity';
import { SyncTypeEnum } from '../../sync/enums/sync-action.enum';
import {
  NflowSearchFilter,
  NflowSearchRequest,
  NflowSearchRes,
} from '../dtos/nflow-search.dto';
import { NflowRefundRequestDto } from '../dtos/requests/nflow-refund.request.dto';

dayjs.extend(utc);
dayjs.extend(timezone);

@Injectable()
export class NflowService extends AbstractAPIService {
  private renewalPromise: Promise<string> | null = null;

  static readonly USER = '/v1/d/appAccount';
  static readonly ORDER = '/v1/d/orders';
  static readonly ORDER_ITEM = '/v1/d/orderItems';
  static readonly TRANSACTION = '/v1/d/transaction';
  static readonly SUPPORT = '/v1/d/customerSupport';
  static readonly REFUND = '/v1/d/refund';
  static readonly PACKAGE = '/v1/d/package';
  static readonly EVENT = '/v1/d/event';
  static readonly CAMPAIGN = '/v1/d/campaigns';

  constructor(
    private readonly _config: ApiConfigService,
    private readonly _logger: LoggerService,
    private readonly _cache: CacheService,
    private readonly _emitter: EventEmitter2,
    private readonly _i18n: TranslationService,
    private readonly _dataSource: DataSource,
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
        const msg = error?.response?.data?.errors || error?.message || error;

        this._logger.error(`[NFLOW ERROR] TraceId [${traceId}]: >>>>`);
        this._logger.error(msg);
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
      [SyncTypeEnum.USER]: NflowService.USER,
      [SyncTypeEnum.ORDER]: NflowService.ORDER,
      [SyncTypeEnum.ORDER_ITEM]: NflowService.ORDER_ITEM,
      [SyncTypeEnum.ORDER_TRANSACTION]: NflowService.TRANSACTION,
      [SyncTypeEnum.SUPPORT]: NflowService.SUPPORT,
      [SyncTypeEnum.REFUND]: NflowService.REFUND,
      [SyncTypeEnum.CAMPAIGN]: NflowService.CAMPAIGN,
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
      const msg = error?.response?.data?.errors || error?.message || error;

      this._logger.error(`[SYNC ${type} FAILED] >>>`);
      this._logger.error(msg);
      return false;
    }
  }

  public async refund(order: OrderEntity): Promise<string | boolean> {
    if (!order) return false;

    const isRefunded = await this.isOrderRefunded(order.id);
    if (isRefunded) {
      this._logger.info(`Order [${order.id}] has been refunded`);
      return true;
    }

    const refundCase = this._getRefundCase(order);
    const time = dayjs().tz(DEFAULT_TIMEZONE).format('HH:mm DD/MM/YYYY Z');
    const customer = order.customerName || order.customerEmail || 'Khách hàng';
    const orderNo = `#${order.incrementId}`;

    const req: NflowRefundRequestDto = {
      orderId: order.id,
      userId: order.customerId,
      amount: order.grandTotal,
      description: `[AUTO-REFUND REQUEST] <${customer}> <${orderNo}> <${time}> - Mô tả: ${refundCase}`,
    };

    const syncLog: SyncLogDto = {
      objectId: order.id,
      type: SyncTypeEnum.REFUND,
      action: SyncActionEnum.Sync,
      value: {
        request: req,
        nflowId: '',
      },
      synced: false,
      syncedAt: getUtcNow(),
    };

    const res = await this.sync({
      type: SyncTypeEnum.REFUND,
      action: SyncActionEnum.Sync,
      data: req,
    });

    if (typeof res === 'string') {
      syncLog.value.nflowId = res;
      syncLog.synced = true;
    }

    await this._emitter.emitAsync(EVENT.SYNC.LOG, syncLog);
    return res;
  }

  private async isOrderRefunded(orderId: string): Promise<boolean> {
    try {
      const log = await this._dataSource
        .getRepository(SyncLogEntity)
        .findOneBy({
          objectId: orderId,
          type: SyncTypeEnum.REFUND,
          action: SyncActionEnum.Sync,
          synced: true,
        });
      return !!log;
    } catch (error) {
      return false;
    }
  }

  // Helper method to determine the refund case
  private _getRefundCase(order: OrderEntity): string {
    const refundMessages: Record<string, string> = {
      [OrderTypeEnum.TOKENIZE]: this._i18n.t('common.refund.createTokenize'),
      [OrderTypeEnum.PACKAGE]: this._i18n.t('common.refund.packageFailed'),
      [OrderTypeEnum.FNB]:
        order.status === OrderStatusEnum.REFUNDED
          ? this._i18n.t('common.refund.fnbRefunded')
          : this._i18n.t('common.refund.fnbFailed'),
    };

    const statusMessages: Record<string, string> = {
      [OrderStatusEnum.SELF_STOP]: this._i18n.t('common.refund.selfStop'),
      [OrderStatusEnum.ABNORMAL_STOP]: this._i18n.t(
        'common.refund.abnormalStop',
      ),
      [OrderStatusEnum.FAILED]: this._i18n.t('common.refund.startFailed'),
      [OrderStatusEnum.REFUNDED]: this._i18n.t('common.refund.refunded'),
    };

    return refundMessages[order.type] || statusMessages[order.status] || '';
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

  public async getEvents(ids: string[] = []): Promise<EventValidityDto[]> {
    let filters: NflowSearchFilter[][] = [];
    if (ids.length) {
      filters = ids.map((id) => {
        return [
          {
            fieldName: 'guid',
            operator: '===',
            value: id,
          },
        ];
      });
    }

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
}
