import { BadRequestException, Injectable } from '@nestjs/common';

import { AbstractAPIService } from '../../../shared/services/abstract-api.service';
import { ApiConfigService } from '../../../shared/services/api-config.service';
import { BaseHttpService } from '../../../shared/services/http.service';
import { LoggerService } from '../../../shared/services/logger.service';
import { DEVICE_NO_TEST } from '../constants/constants';
import { MachineInfoDto } from '../dtos/machine-info.dto';
import {
  OperationMachine,
  OperationMachineRequest,
} from '../dtos/operation-machine.request';
import { YglOrderDto } from '../dtos/ygl-order.dto';
import { MachineAllowStatus } from '../enums/allow-status.enum';
import { ClientType } from '../enums/client-type.enum';
import { PayType } from '../enums/pay-type.enum';
import { IDataBean } from '../interfaces/data-bean.interface';
import { IYglResponse } from '../interfaces/ygl-response.interface';
import { SecurityUtil } from '../utils/yigoli.utils';

@Injectable()
export class YigoliService extends AbstractAPIService {
  constructor(
    private readonly _http: BaseHttpService,
    private readonly _config: ApiConfigService,
    private readonly _logger: LoggerService,
  ) {
    super();
  }

  protected getBaseUrl(): string {
    return this._config.yigoli.baseUrl;
  }

  public async getMachineInfo(deviceNo: string): Promise<MachineInfoDto> {
    // ! For testing
    if (this._config.isDevelopment && deviceNo.startsWith(DEVICE_NO_TEST)) {
      return {
        isAllow: MachineAllowStatus.ALLOW,
      };
    }

    try {
      const data = this.transmissionData({ deviceNo });

      this._logger.info(`[YGL] MACHINE INFO REQUEST: ${JSON.stringify(data)}`);

      const url = this.makeUrl(`/api/machine/base/info`);
      const response = await this._http.post<IYglResponse>(url, data);

      this._logger.info(
        `[YGL] MACHINE INFO RESPONSE: ${JSON.stringify(response?.data)}`,
      );

      const resultInfo = response?.data?.resultInfo;
      if (!resultInfo) return null;

      return this.parseResult<MachineInfoDto>(resultInfo);
    } catch (error) {
      this._logger.error(error);
      throw new BadRequestException(error);
    }
  }

  public async operationMachine(
    request: OperationMachineRequest,
  ): Promise<boolean> {
    // ! For testing
    if (
      this._config.isDevelopment &&
      request.deviceNo.startsWith(DEVICE_NO_TEST)
    ) {
      return true;
    }

    try {
      const payType = this.getPayType(request);
      const clientType = request.clientType || ClientType.ANDROID;

      const content: OperationMachine = {
        ...request,
        clientType: clientType,
        clientId: clientType,
        source: 'WASH000002',
        payType: payType,
        currencyCode: 'VND',
        currencySymbol: 'đ',
        isThird: true,
        orderNo: this.generateOrderNo(request.orderNo),
      };

      this._logger.info(
        `[YGL] OPERATION MACHINE REQUEST RAW: ${JSON.stringify(content)}`,
      );

      const data = this.transmissionData(content);

      this._logger.info(
        `[YGL] OPERATION MACHINE REQUEST: ${JSON.stringify(data)}`,
      );

      const url = this.makeUrl(`/api/machine/base/operation`);
      const response = await this._http.post<IYglResponse>(url, data);

      this._logger.info(
        `[YGL] OPERATION MACHINE RESPONSE: ${JSON.stringify(response?.data)}`,
      );

      const isSuccess = !!response?.data?.success;
      if (!isSuccess) {
        throw new BadRequestException(response?.data?.resultCode);
      }

      return isSuccess;
    } catch (error) {
      this._logger.error(error);
      throw new BadRequestException(error);
    }
  }

  public async getOrder(orderId: string): Promise<YglOrderDto> {
    try {
      const data = this.transmissionData({ orderId });

      this._logger.info(`[YGL] ORDER INFO REQUEST: ${JSON.stringify(data)}`);

      const url = this.makeUrl(`/api/order/detail`);
      const response = await this._http.post<IYglResponse>(url, data);

      this._logger.info(
        `[YGL] ORDER INFO RESPONSE: ${JSON.stringify(response?.data)}`,
      );

      const resultInfo = response?.data?.resultInfo;
      if (!resultInfo) return null;

      return this.parseResult<YglOrderDto>(resultInfo);
    } catch (error) {
      this._logger.error(error);
      throw new BadRequestException(error);
    }
  }

  private getPayType(req: OperationMachineRequest): PayType {
    if (req.deductAmount > 0) {
      if (req.orderActualAmount === 0) {
        return PayType.VOUCHER;
      }

      return PayType.PARTIAL;
    }

    return PayType.CASH;
  }

  public transmissionData(jsonObject: any): IDataBean {
    const content = SecurityUtil.encryptDes(
      JSON.stringify(jsonObject),
      this._config.yigoli.desKey,
    );

    const sign = SecurityUtil.signRSA(
      JSON.stringify(jsonObject),
      this._config.yigoli.privateKey,
    );

    return {
      header: {
        devId: this._config.yigoli.devId,
        sign,
        timeStamp: String(Date.now()),
      },
      body: content,
    };
  }

  public parseResult<T>(bodyStr: any): T {
    const requestBody =
      typeof bodyStr === 'string' ? JSON.parse(bodyStr) : bodyStr;

    const body = requestBody.body;
    if (!body) {
      throw new Error(
        'The value whose key is body in the message body is null',
      );
    }
    const header = requestBody.header;
    if (!header) {
      throw new Error(
        'The value of the base is Sid in the message body is empty',
      );
    }

    const { devId, sign } = header;
    if (!devId) {
      throw new Error('devId is empty');
    }
    if (!sign) {
      throw new Error('sign is empty');
    }

    const publicKey = this._config.yigoli.yglPublicKey;

    const data = SecurityUtil.decryptDes(body, this._config.yigoli.desKey);
    if (!SecurityUtil.verifyRSA(data, publicKey, sign)) {
      throw new Error('The signature verification failed');
    }

    return JSON.parse(data);
  }

  public generateOrderNo(orderNo: string): string {
    return `${this._config.yigoli.prefix}${orderNo}`.trim();
  }

  public removePrefixOrderNo(orderNo: string): string {
    return orderNo.replace(this._config.yigoli.prefix, '').trim();
  }
}
