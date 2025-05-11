import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SharedModule } from '../../shared/shared.module';
import { BiteboltModule } from '../bitebolt/bitebolt.module';
import { MembershipModule } from '../membership/membership.module';
import { NflowSharedModule } from '../nflow/nflow-shared.module';
import { NotificationModule } from '../notification/notification.module';
import { PackageModule } from '../package/package.module';
import { PaymentModule } from '../payment/payment.module';
import { StationModule } from '../station/station.module';
import { TaxModule } from '../tax/tax.module';
import { UserModule } from '../user/user.module';
import { YigoliModule } from '../yigoli/yigoli.module';
import { FnbOrderController } from './controllers/fnb-order.controller';
import { OrderController } from './controllers/order.controller';
import { OrderEntity } from './entities/order.entity';
import { OrderItemEntity } from './entities/order-item.entity';
import { OrderListener } from './listeners/order.listener';
import { OrderProfile } from './profiles/order.profile';
import { FnbOrderService } from './services/fnb-order.service';
import { OrderService } from './services/order.service';

const providers: any = [
  OrderService,
  OrderProfile,
  OrderListener,
  FnbOrderService,
];

@Module({
  imports: [
    PaymentModule,
    SharedModule,
    YigoliModule,
    MembershipModule,
    NotificationModule,
    forwardRef(() => UserModule),
    TaxModule,
    StationModule,
    BiteboltModule,
    PackageModule,
    NflowSharedModule,
    TypeOrmModule.forFeature([OrderEntity, OrderItemEntity]),
  ],
  controllers: [OrderController, FnbOrderController],
  exports: providers,
  providers: providers,
})
export class OrderModule {}
