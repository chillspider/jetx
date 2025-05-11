import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';

import { QUEUE } from '../../../constants';
import { LoggerService } from '../../../shared/services/logger.service';
import { InvoiceProcessEnum } from '../enums/invoice-process.enum';
import { InvoiceService } from '../services/invoice.service';

@Processor(QUEUE.INVOICE.IMPORT)
export class InvoiceImportConsumer {
  constructor(
    private readonly _logger: LoggerService,
    private readonly _invoiceService: InvoiceService,
  ) {}

  @Process(InvoiceProcessEnum.IMPORT)
  async process(job: Job<string>) {
    const orderId = job.data;
    if (!orderId) return false;

    try {
      this._logger.info(`[IMPORT INVOICE] order: ${orderId}`);
      return await this._invoiceService.import(orderId);
    } catch (err) {
      this._logger.error(`[IMPORT INVOICE ERROR]: ${err}`);
      return false;
    }
  }
}
