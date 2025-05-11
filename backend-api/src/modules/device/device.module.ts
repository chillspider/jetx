import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SharedModule } from '../../shared/shared.module';
import { PaymentModule } from '../payment/payment.module';
import { StationModule } from '../station/station.module';
import { YigoliModule } from '../yigoli/yigoli.module';
import { AttentionController } from './controllers/attention.controller';
import { DeviceController } from './controllers/device.controller';
import { AttentionEntity } from './entities/attention.entity';
import { DeviceEntity } from './entities/device.entity';
import { DeviceAttentionEntity } from './entities/device-attention.entity';
import { DeviceLogEntity } from './entities/device-log.entity';
import { AttentionProfile } from './profiles/attention.profile';
import { DeviceProfile } from './profiles/device.profile';
import { AttentionService } from './services/attention.service';
import { DeviceService } from './services/device.service';

const providers = [
  DeviceService,
  DeviceProfile,
  AttentionService,
  AttentionProfile,
];

@Module({
  imports: [
    SharedModule,
    YigoliModule,
    PaymentModule,
    forwardRef(() => StationModule),
    TypeOrmModule.forFeature([
      DeviceEntity,
      AttentionEntity,
      DeviceAttentionEntity,
      DeviceLogEntity,
    ]),
  ],
  controllers: [DeviceController, AttentionController],
  exports: providers,
  providers: providers,
})
export class DeviceModule {}
