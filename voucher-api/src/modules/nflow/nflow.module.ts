import { Module } from '@nestjs/common';

import { SharedModule } from '../../shared/shared.module';
import { B2bVoucherModule } from '../b2b-voucher/b2b-voucher.module';
import { VoucherModule } from '../voucher/voucher.module';
import { NflowController } from './nflow.controller';
import { NflowService } from './services/nflow.service';

@Module({
  controllers: [NflowController],
  imports: [SharedModule, VoucherModule, B2bVoucherModule],
  providers: [NflowService],
  exports: [NflowService],
})
export class NflowModule {}
