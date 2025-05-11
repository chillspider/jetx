import { Inject, Injectable } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';

import { ResponseDto } from '../../common/dto/response.dto';
import { generateSignature } from '../../common/utils';
import { InvoiceDto } from '../dtos/invoice.dto';
import { CreateB2bInvoiceRequestDto } from '../dtos/issue-b2b-invoice.request.dto';
import { AbstractAPIService } from './abstract-api.service';
import { ApiConfigService } from './api-config.service';
import { LoggerService } from './logger.service';

@Injectable()
export class BeAPIService extends AbstractAPIService {
  constructor(
    @Inject(REQUEST) private readonly _request: any,
    private readonly _config: ApiConfigService,
    private readonly _logger: LoggerService,
  ) {
    super();
  }

  protected getBaseUrl(): string {
    return this._config.beAPI.url;
  }

  public async issueB2bInvoice(
    invoice: CreateB2bInvoiceRequestDto,
  ): Promise<InvoiceDto> {
    try {
      const signature = generateSignature(
        JSON.stringify(invoice),
        this._config.beAPI.secret,
      );

      const response = await this.http.post<ResponseDto<InvoiceDto>>(
        this.makeUrl(`/api/v1/invoices/b2b/issue`),
        invoice,
        {
          headers: { signature: signature },
        },
      );
      return response?.data?.data;
    } catch (error) {
      this._logger.error(error);
      return null;
    }
  }
}
