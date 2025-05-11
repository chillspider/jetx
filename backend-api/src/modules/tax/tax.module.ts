import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { TypeOrmModule } from '@nestjs/typeorm';

import { EVENT, QUEUE } from '../../constants';
import { ApiConfigService } from '../../shared/services/api-config.service';
import { SharedModule } from '../../shared/shared.module';
import { EasyInvoiceModule } from '../easyinvoice/easyinvoice.module';
import {
  IEasyInvoiceOptions,
  ITransactionLog,
} from '../easyinvoice/interfaces/easy-invoice-options-provider.interface';
import { InvoiceImportConsumer } from './consumers/invoice-import.consumer';
import { InvoicePublishConsumer } from './consumers/invoice-publish.consumer';
import { InvoiceController } from './controllers/invoice.controller';
import { InvoiceEntity } from './entities/invoice.entity';
import { InvoiceBillingEntity } from './entities/invoice-billing.entity';
import { InvoiceItemEntity } from './entities/invoice-item.entity';
import { InvoiceProviderEntity } from './entities/invoice-provider.entity';
import { InvoiceProfile } from './profiles/invoice.profile';
import { EncryptService } from './services/encrypt.service';
import { InvoiceService } from './services/invoice.service';
import { InvoiceProviderService } from './services/invoice-provider.service';

const ENTITIES = [
  InvoiceEntity,
  InvoiceBillingEntity,
  InvoiceItemEntity,
  InvoiceProviderEntity,
];

@Module({
  imports: [
    SharedModule,
    TypeOrmModule.forFeature(ENTITIES),
    EasyInvoiceModule.forRootAsync({
      useFactory: (
        configService: ApiConfigService,
        emitter: EventEmitter2,
      ): IEasyInvoiceOptions => {
        const transactionLog: ITransactionLog = {
          log: (type: string, action: string, objectId: string, data: any) => {
            emitter.emit(EVENT.ACTIVITY_LOG, {
              action: type,
              objectId,
              value: { action: action, data: data },
            });
          },
        };

        return {
          config: {
            env: configService.nodeEnv as any,
            transactionLog,
          },
        };
      },
      inject: [ApiConfigService, EventEmitter2],
      imports: [SharedModule],
    }),
    BullModule.registerQueue({
      name: QUEUE.INVOICE.PUBLISH,
    }),
    BullModule.registerQueue({
      name: QUEUE.INVOICE.IMPORT,
    }),
  ],
  controllers: [InvoiceController],
  providers: [
    InvoiceService,
    InvoiceProfile,
    InvoiceProviderService,
    InvoicePublishConsumer,
    InvoiceImportConsumer,
    EncryptService,
  ],
  exports: [InvoiceService, InvoiceProviderService, BullModule],
})
export class TaxModule {}
