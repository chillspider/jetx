import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SharedModule } from '../../shared/shared.module';
import { NflowSharedModule } from '../nflow/nflow-shared.module';
import { VoucherModule } from '../voucher/voucher.module';
import { B2bVoucherController } from './controllers/b2b-voucher.controller';
import { B2bVoucherEntity } from './entities/b2b-voucher.entity';
import { B2bVoucherCodeEntity } from './entities/b2b-voucher-code.entity';
import { B2bVoucherInvoiceEntity } from './entities/b2b-voucher-invoice.entity';
import { B2bVoucherListener } from './listeners/b2b-voucher.listener';
import { B2bVoucherProfile } from './profiles/b2b-voucher.profile';
import { B2bVoucherService } from './services/b2b-voucher.service';

@Module({
  imports: [
    SharedModule,
    VoucherModule,
    NflowSharedModule,
    TypeOrmModule.forFeature([
      B2bVoucherEntity,
      B2bVoucherCodeEntity,
      B2bVoucherInvoiceEntity,
    ]),
  ],
  controllers: [B2bVoucherController],
  providers: [B2bVoucherService, B2bVoucherProfile, B2bVoucherListener],
  exports: [B2bVoucherService],
})
export class B2bVoucherModule {}
