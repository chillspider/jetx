import * as crypto from 'node:crypto';

import { HttpService } from '@nestjs/axios';
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  NotImplementedException,
} from '@nestjs/common';
import { AxiosResponse } from 'axios';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import { XMLBuilder } from 'fast-xml-parser';
import { Agent } from 'https';
import { lastValueFrom } from 'rxjs';

import { DEFAULT_TIMEZONE } from '../../../constants/config';
import { W24Error } from '../../../constants/error-code';
import { EASY_INVOICE_OPTIONS } from '../constants/easy-invoice-option.constant';
import { EasyInvoiceType } from '../constants/easy-invoice-type.enum';
import { EasyInvoiceSetting } from '../dtos/easy-invoice-setting.dto';
import {
  IEasyInvoiceOptions,
  InvoiceCode01Type,
  InvoiceCode02Type,
} from '../interfaces/easy-invoice-options-provider.interface';
import { IEasyInvoiceResponse } from '../interfaces/easy-invoice-response.interface';
import { IEasyInvoiceResult } from '../interfaces/easy-invoice-result.interface';
import { IInvoiceRequest } from '../interfaces/invoice.interface';
import { ITemplateXml } from '../interfaces/invoice-xml.interface';
import { CompanyXmlBuilder } from './xml-builder/company-xml-builder.service';
import { HouseholdXmlBuilder } from './xml-builder/household-xml-builder.service';

enum InvoiceStatus {
  SUCCESS = 2,
  CLIENT_ERROR = 4,
  SERVER_ERROR = 5,
}

dayjs.extend(timezone);

@Injectable()
export class EasyInvoiceConnectorService {
  static IMPORT_AND_ISSUE_ENDPOINT = 'api/publish/importAndIssueInvoice';
  static IMPORT_AND_ENDPOINT = 'api/publish/importInvoice';
  static ADD_IKEY_ENDPOINT = 'api/publish/insertIKey';
  static GET_INVOICES_BY_IKEY_ENDPOINT = 'api/publish/getInvoicesByIkeys';
  static GET_INVOICE_STRIP_ENDPOINT = 'api/business/getInvoiceStrip';
  static SEND_ISSUANCE_NOTICE = 'api/business/sendIssuanceNotice';
  static CANCEL_INVOICE = 'api/business/cancelInvoice';

  constructor(
    private readonly setting: EasyInvoiceSetting,
    @Inject(EASY_INVOICE_OPTIONS)
    private readonly moduleOpt: IEasyInvoiceOptions,
    private readonly httpService: HttpService,
  ) {}

  public getCode() {
    return 'EASY-INVOICE';
  }

  private generateRandomString(length: number): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    const charactersLength = characters.length;

    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }

    return result;
  }

  private getEasyinvoiceConfig(method?: string): {
    headers: {
      Authentication: string;
    };
  } {
    const { username, password } = this.setting;

    if (!username || !password) {
      throw new BadRequestException(W24Error.InvalidAuthCredentials);
    }

    const timestamp: number = Math.floor(Date.now() / 1000);
    const nonce: string = this.generateRandomString(32);
    const signature: string = (method ?? 'POST') + timestamp + nonce;
    const hash: string = crypto
      .createHash('md5')
      .update(signature)
      .digest('base64');

    return {
      headers: {
        ['Authentication']: `${hash}:${nonce}:${timestamp}:${username}:${password}`,
      },
    };
  }

  private getHost() {
    if (!this.setting.code) {
      throw new BadRequestException(W24Error.InvalidAuthCredentials);
    }

    switch (this.moduleOpt.config.env) {
      case 'production':
        return `https://${this.setting.code}.easyinvoice.com.vn`;
      default:
        return `http://${this.setting.code}.softdreams.vn`;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const result = await this.request<any>(
        EasyInvoiceConnectorService.GET_INVOICE_STRIP_ENDPOINT,
        'POST',
        {
          Pattern: this.getPattern(),
          Serial: '',
        },
      );
      console.log(result.data);
      return !!result.data;
    } catch (err) {
      console.error(err);
      throw new BadRequestException(err?.response?.data?.Message ?? err);
    }
  }

  log(type: string, action: string, objectId: string, data: any) {
    if (this.moduleOpt.config.transactionLog) {
      this.moduleOpt.config.transactionLog.log(type, action, objectId, data);
    } else {
      console.log(type, action, objectId, data);
    }
  }

  private getPattern() {
    const year = dayjs().tz(DEFAULT_TIMEZONE).format('YY');
    const code01 = this.setting.code01 ?? InvoiceCode01Type.C;
    const code02 = this.setting.code02 ?? InvoiceCode02Type.M;
    const manageType = 'YY';
    return this.setting.pattern
      ? this.setting.pattern.replace('<YY>', year)
      : `2${code01}${year}${code02}${manageType}`;
  }

  prepareIkey(request: IInvoiceRequest): string {
    return `HD-${request.orderId}`;
  }

  replace(request: IInvoiceRequest): Promise<any> {
    console.log(request);
    return null;
  }

  public async getInvoicesById(ids: string[]): Promise<IEasyInvoiceResponse> {
    console.log(ids);
    try {
      const result = await this.request<IEasyInvoiceResponse>(
        EasyInvoiceConnectorService.GET_INVOICES_BY_IKEY_ENDPOINT,
        'POST',
        {
          Ikeys: ids,
        },
      );

      return result.data;
    } catch (err) {
      console.error(err);
      return null;
    }
  }

  public async createInvoice(
    request: IInvoiceRequest,
  ): Promise<IEasyInvoiceResult> {
    // Binding data
    const xmlBuilder = this.resolverXmlBuilder();
    const xmlData: ITemplateXml = xmlBuilder.build(request);

    const builder: XMLBuilder = new XMLBuilder({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      suppressBooleanAttributes: true,
    });
    const output = builder.build(xmlData);

    try {
      this.log('EASYINVOICE_CREATE_AND_ISSUE', 'REQUEST', request.id, {
        config: this.getEasyinvoiceConfig(),
        endpoint: EasyInvoiceConnectorService.IMPORT_AND_ENDPOINT,
        host: this.getHost(),
        payload: {
          XmlData: output,
          Pattern: this.getPattern(),
          Serial: '',
        },
      });

      const result = await this.request<IEasyInvoiceResponse>(
        EasyInvoiceConnectorService.IMPORT_AND_ENDPOINT,
        'POST',
        {
          XmlData: output,
          Pattern: this.getPattern(),
          Serial: '',
        },
      );
      this.log('EASYINVOICE_CREATE', 'RESPONSE', request.id, result.data);
      return {
        result: result.data.Status === InvoiceStatus.SUCCESS,
        data: result.data,
      };
    } catch (err) {
      console.error(err);
      if (err.response) {
        this.log('EASYINVOICE_CREATE', 'RESPONSE', request.id, err.response);
      } else {
        this.log('EASYINVOICE_CREATE', 'RESPONSE', request.id, err.message);
      }
      return null;
    }
  }

  resolverXmlBuilder() {
    switch (this.setting.type) {
      case EasyInvoiceType.VAT:
        return new CompanyXmlBuilder();
      case EasyInvoiceType.HKD:
        return new HouseholdXmlBuilder();
      default:
        throw new NotImplementedException();
    }
  }

  public async createAndIssueInvoice(
    request: IInvoiceRequest,
  ): Promise<IEasyInvoiceResult> {
    // Binding data
    const xmlBuilder = this.resolverXmlBuilder();
    const xmlData: ITemplateXml = xmlBuilder.build(request);

    const builder: XMLBuilder = new XMLBuilder({
      attributeNamePrefix: '@_',
      suppressBooleanAttributes: true,
    });
    const output = builder.build(xmlData);

    try {
      this.log('EASYINVOICE_CREATE_AND_ISSUE', 'REQUEST', request.id, {
        config: this.getEasyinvoiceConfig(),
        endpoint: EasyInvoiceConnectorService.IMPORT_AND_ISSUE_ENDPOINT,
        host: this.getHost(),
        payload: {
          XmlData: output,
          Pattern: this.getPattern(),
          Serial: '',
        },
      });
      const result = await this.request<IEasyInvoiceResponse>(
        EasyInvoiceConnectorService.IMPORT_AND_ISSUE_ENDPOINT,
        'POST',
        {
          XmlData: output,
          Pattern: this.getPattern(),
          Serial: '',
        },
      );
      this.log(
        'EASYINVOICE_CREATE_AND_ISSUE',
        'RESPONSE',
        request.id,
        result.data,
      );
      return {
        result: result.data.Status === InvoiceStatus.SUCCESS,
        externalId: result.data.Data.Invoices[0].Ikey,
        data: result.data,
      };
    } catch (err) {
      console.error(err);
      if (err.response) {
        this.log('EASYINVOICE_CREATE_AND_ISSUE', 'RESPONSE', request.id, {
          status: err.response.status,
          data: err.response.data,
        });
      } else {
        this.log(
          'EASYINVOICE_CREATE_AND_ISSUE',
          'RESPONSE',
          request.id,
          err.message,
        );
      }

      return {
        result: false,
        data: null,
      };
    }
  }

  public async addIkey(request: {
    iKey: string;
    invoiceNumber: string;
    customerId: string;
  }): Promise<boolean> {
    const { iKey, invoiceNumber } = request;

    try {
      const resData: AxiosResponse<any, any> | undefined = await this.request(
        EasyInvoiceConnectorService.ADD_IKEY_ENDPOINT,
        'POST',
        {
          Ikey: iKey,
          No: invoiceNumber,
          Pattern: this.getPattern(),
        },
      );

      if (resData && resData.data?.Status !== InvoiceStatus.SUCCESS) {
        throw new BadRequestException(resData.data?.Message);
      }
    } catch (err) {
      console.error(err);
      return false;
    }

    return true;
  }

  public async sendIssuanceNotice(
    key: string,
    email: string,
  ): Promise<boolean> {
    try {
      const resData: AxiosResponse<any, any> | undefined = await this.request(
        EasyInvoiceConnectorService.SEND_ISSUANCE_NOTICE,
        'POST',
        { IkeyEmail: { [key]: email } },
      );

      if (resData && resData.data?.Status !== InvoiceStatus.SUCCESS) {
        throw new NotFoundException(resData.data?.Message);
      }
    } catch (err) {
      console.error(err);
      return false;
    }

    return true;
  }

  public async cancelInvoice(iKey: string): Promise<boolean> {
    try {
      const resData: AxiosResponse<any, any> | undefined = await this.request(
        EasyInvoiceConnectorService.CANCEL_INVOICE,
        'POST',
        {
          Ikey: iKey,
        },
      );

      if (resData && resData.data?.Status !== InvoiceStatus.SUCCESS) {
        throw new NotFoundException(resData.data?.Message);
      }
    } catch (err) {
      console.error(err);
      return false;
    }

    return true;
  }

  private getRequestConfig() {
    const config = this.getEasyinvoiceConfig();
    return {
      ...config,
      httpsAgent: new Agent({
        rejectUnauthorized: false,
      }),
    };
  }

  public request<T>(
    path: string,
    method: string = 'POST',
    data: any,
  ): Promise<AxiosResponse<T>> {
    const config = this.getRequestConfig();
    const host = this.getHost();
    const url = `${host}/${path}`;

    let result;
    switch (method) {
      case 'POST':
        result = this.httpService.post<T>(url, data, config);
        break;
      case 'GET':
        result = this.httpService.get<T>(url, config);
        break;
      default:
        throw new NotImplementedException();
    }

    return lastValueFrom(result);
  }
}
