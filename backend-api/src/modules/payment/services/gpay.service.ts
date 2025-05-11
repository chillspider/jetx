import { BadRequestException, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AxiosResponse } from 'axios';
import * as crypto from 'crypto';
import dayjs from 'dayjs';

import { EVENT } from '../../../constants';
import { AbstractAPIService } from '../../../shared/services/abstract-api.service';
import { ApiConfigService } from '../../../shared/services/api-config.service';
import { LoggerService } from '../../../shared/services/logger.service';
import { TGPay } from '../../../shared/types/payment';
import {
  GPayQueryExtraDataRequest,
  GPayQueryRequest,
} from '../dtos/gpay/gpay-query.request';
import {
  GPayPaymentResponseDto,
  GPayResponseData,
} from '../dtos/gpay/gpay-response';
import { TransactionLogDto } from '../dtos/transaction-log.dto';
import { OrderTransactionLogType } from '../enums/order-transaction-log.enum';
import { PaymentMethod, PaymentProvider } from '../enums/payment-method.enum';
import { PaymentStatusEnum } from '../enums/payment-status.enum';
import { PaymentOrderTransactionType } from '../enums/payment-transaction-type.enum';
import {
  IGPayPaymentRequest,
  IGPayRequestData,
} from '../interfaces/payment-gpay.interface';

type TGPayHeader = {
  apiKey: string;
  signature: string;
  callerId?: string;
};

@Injectable()
export class GPayService extends AbstractAPIService {
  private _gPayConfig: TGPay;
  constructor(
    private readonly _logger: LoggerService,
    private readonly _config: ApiConfigService,
    private readonly _emitter: EventEmitter2,
  ) {
    super();

    const { endpoint, ipnEndpoint } = this._config.gpay;
    if (!endpoint || !ipnEndpoint) {
      this._logger.warn('GPay service is lacking of endpoint api');
    }
    this._gPayConfig = this._config.gpay;
  }

  protected getBaseUrl(): string {
    return this._gPayConfig.endpoint;
  }

  public async createPaymentTransaction({
    requestData,
    orderTransactionId,
  }: {
    requestData: IGPayRequestData;
    orderTransactionId: string;
  }): Promise<GPayResponseData> {
    try {
      const { ipnEndpoint, saltKey, apiKey } = this._gPayConfig;
      requestData.ipnURL = ipnEndpoint;

      const request: IGPayPaymentRequest = {
        requestID: orderTransactionId,
        requestDateTime: dayjs().format('YYYYMMDDHHmmss'),
        requestData: requestData,
      };

      const signature = this._createSignature(request, saltKey);
      const headers = this._getHeaders({ signature, apiKey });

      const reqLog: TransactionLogDto = {
        orderId: requestData.orderID,
        orderIncrementId: requestData.orderNumber,
        paymentMethod: PaymentMethod.CREDIT,
        paymentProvider: PaymentProvider.GPay,
        transactionType: PaymentOrderTransactionType.PAYMENT,
        header: headers,
        params: {},
        requestId: request.requestID,
        data: request,
        type: OrderTransactionLogType.PaymentReq,
        orderTransactionId,
      };

      this._emitter.emit(EVENT.ORDER_TRANSACTION.LOG, reqLog);

      const response: AxiosResponse<GPayPaymentResponseDto> =
        await this.http.post(
          this.makeUrl(`/transaction/payWithOption`),
          JSON.stringify(request),
          {
            headers,
          },
        );

      const resLog: TransactionLogDto = {
        orderId: request.requestData.orderID,
        orderIncrementId: request.requestData.orderNumber,
        paymentMethod: PaymentMethod.CREDIT,
        paymentProvider: PaymentProvider.GPay,
        transactionType: PaymentOrderTransactionType.PAYMENT,
        header: headers,
        params: {},
        requestId: request.requestID,
        data: response?.data,
        type: OrderTransactionLogType.PaymentRes,
        transactionId: response.data?.responseData?.transactionID,
        orderTransactionId,
      };
      this._emitter.emit(EVENT.ORDER_TRANSACTION.LOG, resLog);

      const { data } = response;

      if (data?.responseCode !== PaymentStatusEnum.SUCCESS) {
        throw new BadRequestException(data);
      }

      return data.responseData;
    } catch (err) {
      this._logger.error(err);
      this._logger.error(err?.response?.data);
      throw new BadRequestException(err);
    }
  }

  public async createTokenPaymentTransaction({
    requestData,
    orderTransactionId,
  }: {
    requestData: IGPayRequestData;
    orderTransactionId: string;
  }): Promise<GPayResponseData> {
    try {
      const { ipnEndpoint, saltKey, apiKey } = this._gPayConfig;
      requestData.ipnURL = ipnEndpoint;

      const request: IGPayPaymentRequest = {
        requestID: crypto.randomUUID(),
        requestDateTime: dayjs().format('YYYYMMDDHHmmss'),
        requestData: requestData,
      };

      const signature = this._createSignature(request, saltKey);
      const headers = this._getHeaders({ signature, apiKey });

      const reqLog: TransactionLogDto = {
        orderId: requestData.orderID,
        orderIncrementId: requestData.orderNumber,
        paymentMethod: PaymentMethod.TOKEN,
        paymentProvider: PaymentProvider.GPay,
        transactionType: PaymentOrderTransactionType.PAYMENT,
        header: headers,
        params: {},
        requestId: request.requestID,
        data: request,
        type: OrderTransactionLogType.PaymentReq,
        orderTransactionId,
      };

      this._emitter.emit(EVENT.ORDER_TRANSACTION.LOG, reqLog);

      const response: AxiosResponse<GPayPaymentResponseDto> =
        await this.http.post(
          this.makeUrl(`/transaction/pay`),
          JSON.stringify(request),
          {
            headers,
          },
        );

      const resLog: TransactionLogDto = {
        orderId: request.requestData.orderID,
        orderIncrementId: request.requestData.orderNumber,
        paymentMethod: PaymentMethod.CREDIT,
        paymentProvider: PaymentProvider.GPay,
        transactionType: PaymentOrderTransactionType.PAYMENT,
        header: headers,
        params: {},
        requestId: request.requestID,
        data: response?.data,
        type: OrderTransactionLogType.PaymentRes,
        transactionId: response.data?.responseData?.transactionID,
        orderTransactionId,
      };
      this._emitter.emit(EVENT.ORDER_TRANSACTION.LOG, resLog);

      const { data } = response;

      if (data?.responseCode !== PaymentStatusEnum.SUCCESS) {
        throw new BadRequestException(data);
      }

      return data.responseData;
    } catch (err) {
      this._logger.error(err);
      this._logger.error(err?.response?.data);
      throw new BadRequestException(err);
    }
  }

  public async createQRPaymentTransaction({
    requestData,
    orderTransactionId,
  }: {
    requestData: IGPayRequestData;
    orderTransactionId: string;
  }): Promise<GPayResponseData> {
    try {
      const { ipnEndpoint, saltKey, apiKey } = this._gPayConfig;
      requestData.ipnURL = ipnEndpoint;

      const request: IGPayPaymentRequest = {
        requestID: crypto.randomUUID(),
        requestDateTime: dayjs().format('YYYYMMDDHHmmss'),
        requestData: requestData,
      };

      const signature = this._createSignature(request, saltKey);
      const headers = this._getHeaders({ signature, apiKey });

      const reqLog: TransactionLogDto = {
        orderId: requestData.orderID,
        orderIncrementId: requestData.orderNumber,
        paymentMethod: PaymentMethod.QRPAY,
        paymentProvider: PaymentProvider.GPay,
        transactionType: PaymentOrderTransactionType.PAYMENT,
        header: headers,
        params: {},
        requestId: request.requestID,
        data: request,
        type: OrderTransactionLogType.PaymentReq,
        orderTransactionId,
      };

      this._emitter.emit(EVENT.ORDER_TRANSACTION.LOG, reqLog);

      const response: AxiosResponse<GPayPaymentResponseDto> =
        await this.http.post(
          this.makeUrl(`/transaction/payWithQR`),
          JSON.stringify(request),
          {
            headers,
          },
        );

      const resLog: TransactionLogDto = {
        orderId: request.requestData.orderID,
        orderIncrementId: request.requestData.orderNumber,
        paymentMethod: PaymentMethod.QRPAY,
        paymentProvider: PaymentProvider.GPay,
        transactionType: PaymentOrderTransactionType.PAYMENT,
        header: headers,
        params: {},
        requestId: request.requestID,
        data: response?.data,
        type: OrderTransactionLogType.PaymentRes,
        transactionId: response.data?.responseData?.transactionID,
        orderTransactionId,
      };
      this._emitter.emit(EVENT.ORDER_TRANSACTION.LOG, resLog);

      const { data } = response;

      if (data?.responseCode !== PaymentStatusEnum.SUCCESS) {
        throw new BadRequestException(data);
      }

      return data.responseData;
    } catch (err) {
      this._logger.error(err);
      this._logger.error(err?.response?.data);
      throw new BadRequestException(err);
    }
  }

  public async query(
    transactionID: string,
  ): Promise<GPayPaymentResponseDto | null> {
    const request: GPayQueryRequest<GPayQueryExtraDataRequest> = {
      requestID: crypto.randomUUID(),
      requestDateTime: dayjs().format('YYYYMMDDHHmmss'),
      requestData: {
        transactionID: transactionID,
      },
    };

    try {
      const { apiKey, saltKey } = this._gPayConfig;
      const signature = this._createSignature(request, saltKey);
      const headers = this._getHeaders({ signature, apiKey });

      const response: AxiosResponse<GPayPaymentResponseDto> =
        await this.http.post(this.makeUrl(`/transaction/query`), request, {
          headers,
        });

      const { data } = response;
      if (data?.responseCode !== PaymentStatusEnum.SUCCESS) {
        throw new BadRequestException(data.responseMessage);
      }
      return data;
    } catch (err) {
      this._logger.error(err);
      this._logger.error(err?.response?.data);
      return null;
    }
  }

  public async deleteToken(token: string): Promise<boolean> {
    const request: GPayQueryRequest<{ token: string }> = {
      requestID: crypto.randomUUID(),
      requestDateTime: dayjs().format('YYYYMMDDHHmmss'),
      requestData: {
        token: token,
      },
    };

    try {
      const { apiKey, saltKey } = this._gPayConfig;

      const signature = this._createSignature(request, saltKey);
      const headers = this._getHeaders({ signature, apiKey });

      const response: AxiosResponse<GPayPaymentResponseDto> =
        await this.http.post(
          this.makeUrl(`/tokenization/deleteToken`),
          JSON.stringify(request),
          {
            headers,
          },
        );

      const { data } = response;
      return data?.responseCode === PaymentStatusEnum.SUCCESS;
    } catch (err) {
      this._logger.error(err);
      this._logger.error(err?.response?.data);
      return null;
    }
  }

  private _getHeaders({
    signature,
    apiKey,
  }: {
    signature: string;
    apiKey: string;
  }): TGPayHeader {
    const header: TGPayHeader = {
      apiKey,
      signature,
    };

    return header;
  }

  private _createSignature(
    data: Record<string, string | number | boolean | any> | any,
    salt: string,
  ) {
    const payload = JSON.stringify(data);

    const toHash = payload + salt;

    const signature = crypto
      .createHash('sha256')
      .update(toHash, 'utf8')
      .digest('hex');

    return signature;
  }
}
