import { BullModule } from '@nestjs/bull';
import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { QUEUE } from '../../constants';
import { SharedModule } from '../../shared/shared.module';
import { MembershipModule } from '../membership/membership.module';
import { NflowSharedModule } from '../nflow/nflow-shared.module';
import { OrderModule } from '../order/order.module';
import { PaymentModule } from '../payment/payment.module';
import { UserConsumer } from './consumers/user.consumer';
import { UserController } from './controllers/user.controller';
import { UserTokenController } from './controllers/user-token.controller';
import { VehicleController } from './controllers/vehicle.controller';
import { ReferralEntity } from './entities/referral.entity';
import { UserEntity } from './entities/user.entity';
import { UserRoleEntity } from './entities/user-role.entity';
import { UserTokenEntity } from './entities/user-token.entity';
import { VehicleEntity } from './entities/vehicle.entity';
import { UserListener } from './listeners/user.listener';
import { UserProfile } from './profiles/user.profile';
import { VehicleProfile } from './profiles/vehicle.profile';
import { ReferralService } from './services/referral.service';
import { UserService } from './services/user.service';
import { UserTokenService } from './services/user-token.service';
import { VehicleService } from './services/vehicle.service';

const providers = [
  UserService,
  VehicleService,
  UserProfile,
  VehicleProfile,
  UserTokenService,
  ReferralService,
  UserListener,
  UserConsumer,
];

@Module({
  imports: [
    SharedModule,
    PaymentModule,
    MembershipModule,
    forwardRef(() => OrderModule),
    NflowSharedModule,
    TypeOrmModule.forFeature([
      UserEntity,
      UserRoleEntity,
      VehicleEntity,
      UserTokenEntity,
      ReferralEntity,
    ]),
    BullModule.registerQueue({
      name: QUEUE.USER.REDEEM_VOUCHER,
    }),
  ],
  controllers: [UserController, VehicleController, UserTokenController],
  exports: providers,
  providers: providers,
})
export class UserModule {}
