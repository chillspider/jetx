import { Module } from '@nestjs/common';

import { SharedModule } from '../../shared/shared.module';
import { AuthModule } from '../auth/auth.module';
import { BiteboltModule } from '../bitebolt/bitebolt.module';
import { DeviceModule } from '../device/device.module';
import { ExportModule } from '../export/export.module';
import { NotificationModule } from '../notification/notification.module';
import { OrderModule } from '../order/order.module';
import { PackageModule } from '../package/package.module';
import { ProductModule } from '../product/product.module';
import { StationModule } from '../station/station.module';
import { SupportModule } from '../support/support.module';
import { SyncModule } from '../sync/sync.module';
import { TaxModule } from '../tax/tax.module';
import { UserModule } from '../user/user.module';
import { NflowController } from './controllers/nflow.controller';
import { NflowAuthController } from './controllers/nflow-auth.controller';
import { NflowAuthService } from './services/nflow-auth.service';
import { NflowResourceService } from './services/nflow-resource.service';

@Module({
  imports: [
    SharedModule,
    AuthModule,
    UserModule,
    StationModule,
    ProductModule,
    DeviceModule,
    TaxModule,
    ExportModule,
    OrderModule,
    SupportModule,
    PackageModule,
    SyncModule,
    BiteboltModule,
    NotificationModule,
  ],
  controllers: [NflowAuthController, NflowController],
  providers: [NflowResourceService, NflowAuthService],
})
export class NflowModule {}
