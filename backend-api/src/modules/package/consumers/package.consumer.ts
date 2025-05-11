import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';

import { QUEUE } from '../../../constants';
import { PackageService } from '../services/package.service';

@Processor(QUEUE.PACKAGE.PROCESS)
export class PackageConsumer {
  constructor(private readonly _pkgService: PackageService) {}

  @Process({
    name: QUEUE.PACKAGE.PROCESS,
    concurrency: 1,
  })
  async handleCreateVouchers(job: Job<string>): Promise<void> {
    const orderId = job.data;
    if (!orderId) return;

    await this._pkgService.handleCreateVouchers(orderId);
  }
}
