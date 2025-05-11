import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SharedModule } from '../../shared/shared.module';
import { NflowSharedModule } from '../nflow/nflow-shared.module';
import { VoucherController } from './controllers/voucher.controller';
import { VoucherEntity } from './entities/voucher.entity';
import { VoucherService } from './services/voucher.service';
import { VoucherProfile } from './voucher.profile';

@Module({
  imports: [
    SharedModule,
    NflowSharedModule,
    TypeOrmModule.forFeature([VoucherEntity]),
  ],
  controllers: [VoucherController],
  exports: [VoucherService],
  providers: [VoucherService, VoucherProfile],
})
export class VoucherModule {}
