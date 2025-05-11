import { Module } from '@nestjs/common';

import { SharedModule } from '../../shared/shared.module';
import { OrderModule } from '../order/order.module';
import { PaymentModule } from '../payment/payment.module';
import { YigoliModule } from '../yigoli/yigoli.module';
import { BiteboltWebhookController } from './controllers/bitebolt.controller';
import { GPayWebhookController } from './controllers/gpay.controller';
import { YigoliWebhookController } from './controllers/yigoli.controller';
import { BiteboltWebhookService } from './services/bitebolt-webhook.service';
import { PaymentWebhookService } from './services/payment-webhook.service';
import { YigoliWebhookService } from './services/yigoli-webhook.service';

const providers: any = [
  PaymentWebhookService,
  YigoliWebhookService,
  BiteboltWebhookService,
];

@Module({
  imports: [SharedModule, PaymentModule, OrderModule, YigoliModule],
  controllers: [
    GPayWebhookController,
    YigoliWebhookController,
    BiteboltWebhookController,
  ],
  providers: providers,
})
export class WebhookModule {}
