import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SharedModule } from '../../shared/shared.module';
import { PaymentController } from './controllers/payment.controller';
import { OrderTransactionEntity } from './entities/order-transaction.entity';
import { OrderTransactionLogEntity } from './entities/order-transaction-log.entity';
import { OrderTransactionLogListener } from './listeners/order-transaction-log.listener';
import { OrderTransactionProfile } from './profiles/order-transaction.profile';
import { GPayService } from './services/gpay.service';
import { GpayQRService } from './services/gpay-qr.service';
import { PaymentService } from './services/payment.service';

const providers: any = [
  GPayService,
  PaymentService,
  OrderTransactionProfile,
  OrderTransactionLogListener,
  GpayQRService,
];

@Module({
  imports: [
    SharedModule,
    TypeOrmModule.forFeature([
      OrderTransactionEntity,
      OrderTransactionLogEntity,
    ]),
  ],
  controllers: [PaymentController],
  exports: providers,
  providers: providers,
})
export class PaymentModule {}
