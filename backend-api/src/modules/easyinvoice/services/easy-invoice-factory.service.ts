import { HttpService } from '@nestjs/axios';
import { Inject, Injectable } from '@nestjs/common';

import { EASY_INVOICE_OPTIONS } from '../constants/easy-invoice-option.constant';
import { EasyInvoiceSetting } from '../dtos/easy-invoice-setting.dto';
import { IEasyInvoiceOptions } from '../interfaces/easy-invoice-options-provider.interface';
import { EasyInvoiceConnectorService } from './easy-invoice-connector.service';

@Injectable()
export class EasyInvoiceFactoryService {
  constructor(
    @Inject(EASY_INVOICE_OPTIONS)
    private readonly moduleOpt: IEasyInvoiceOptions,
    private readonly httpService: HttpService,
  ) {}

  create(setting: EasyInvoiceSetting): EasyInvoiceConnectorService {
    return new EasyInvoiceConnectorService(
      setting,
      this.moduleOpt,
      this.httpService,
    );
  }
}
