import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';

import { QUEUE } from '../../../constants';
import { LoggerService } from '../../../shared/services/logger.service';
import { InvoiceEntity } from '../entities/invoice.entity';
import { InvoiceProcessEnum } from '../enums/invoice-process.enum';
import { InvoiceService } from '../services/invoice.service';

@Processor(QUEUE.INVOICE.PUBLISH)
export class InvoicePublishConsumer {
  constructor(
    private readonly _logger: LoggerService,
    private readonly _invoiceService: InvoiceService,
  ) {}

  @Process(InvoiceProcessEnum.PUBLISH)
  async process(job: Job<InvoiceEntity>) {
    const invoice = job.data;
    if (!invoice) return false;

    try {
      this._logger.info(
        `[INVOICE PUBLISH] invoice: ${invoice.orderIncrementId}`,
      );
      return await this._invoiceService.publish(invoice);
    } catch (err) {
      this._logger.error(`[INVOICE PUBLISH ERROR]: ${err}`);
      return false;
    }
  }
}
