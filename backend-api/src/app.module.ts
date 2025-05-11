/* eslint-disable @typescript-eslint/naming-convention */
import './boilerplate.polyfill';

import path from 'node:path';

import { classes } from '@automapper/classes';
import { AutomapperModule } from '@automapper/nestjs';
import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClsModule } from 'nestjs-cls';
import {
  AcceptLanguageResolver,
  HeaderResolver,
  I18nModule,
  QueryResolver,
} from 'nestjs-i18n';
import { RequestContextModule } from 'nestjs-request-context';
import { DataSource } from 'typeorm';
import { addTransactionalDataSource } from 'typeorm-transactional';

import { defaultLanguageCode } from './constants';
import { ActivityLogModule } from './modules/activity-logs/activity-log.module';
import { AuthModule } from './modules/auth/auth.module';
import { BiteboltModule } from './modules/bitebolt/bitebolt.module';
import { CarDetectorModule } from './modules/car-detector/car-detector.module';
import { CronModule } from './modules/cron/cron.module';
import { DeviceModule } from './modules/device/device.module';
import { HealthCheckerModule } from './modules/health-checker/health-checker.module';
import { LocationModule } from './modules/location/location.module';
import { MailModule } from './modules/mail/mail.module';
import { MembershipModule } from './modules/membership/membership.module';
import { NflowModule } from './modules/nflow/nflow.module';
import { NotificationModule } from './modules/notification/notification.module';
import { OrderModule } from './modules/order/order.module';
import { PackageModule } from './modules/package/package.module';
import { PaymentModule } from './modules/payment/payment.module';
import { ProductModule } from './modules/product/product.module';
import { SettingModule } from './modules/setting/setting.module';
import { StationModule } from './modules/station/station.module';
import { SupportModule } from './modules/support/support.module';
import { SyncModule } from './modules/sync/sync.module';
import { TaxModule } from './modules/tax/tax.module';
import { UserModule } from './modules/user/user.module';
import { WebhookModule } from './modules/webhook/webhook.module';
import { YigoliModule } from './modules/yigoli/yigoli.module';
import { ApiConfigService } from './shared/services/api-config.service';
import { SharedModule } from './shared/shared.module';

@Module({
  imports: [
    RequestContextModule,
    ClsModule.forRoot({
      global: true,
      middleware: {
        mount: true,
      },
    }),
    ThrottlerModule.forRootAsync({
      imports: [SharedModule],
      useFactory: (configService: ApiConfigService) => ({
        throttlers: [configService.throttlerConfigs],
      }),
      inject: [ApiConfigService],
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [SharedModule],
      useFactory: (configService: ApiConfigService) =>
        configService.postgresConfig,
      inject: [ApiConfigService],
      dataSourceFactory: (options) => {
        if (!options) {
          throw new Error('Invalid options passed');
        }

        return Promise.resolve(
          addTransactionalDataSource(new DataSource(options)),
        );
      },
    }),
    I18nModule.forRootAsync({
      resolvers: [
        AcceptLanguageResolver,
        { use: QueryResolver, options: ['lang', 'locale', 'l'] },
        new HeaderResolver(['x-lang', 'x-custom-lang']),
      ],
      useFactory: (configService: ApiConfigService) => ({
        fallbackLanguage: defaultLanguageCode,
        fallbacks: { 'en-*': 'en', 'vi-*': 'vi' },
        loaderOptions: {
          path: path.join(__dirname, '/i18n/'),
          watch: configService.isDevelopment,
        },
      }),
      imports: [SharedModule],
      inject: [ApiConfigService],
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ApiConfigService) => ({
        redis: {
          host: configService.redis.host,
          port: configService.redis.port,
          password: configService.redis.pass,
          db: configService.redis.db,
        },
        defaultJobOptions: {
          removeOnComplete: true,
          removeOnFail: true,
        },
        prefix: `bull-${configService.prefix}`,
      }),
      inject: [ApiConfigService],
    }),
    HealthCheckerModule,
    EventEmitterModule.forRoot(),
    AutomapperModule.forRoot({
      strategyInitializer: classes(),
    }),
    AuthModule,
    UserModule,
    ProductModule,
    CronModule,
    StationModule,
    MailModule,
    LocationModule,
    DeviceModule,
    YigoliModule,
    OrderModule,
    PaymentModule,
    WebhookModule,
    MembershipModule,
    NotificationModule,
    NflowModule,
    TaxModule,
    ActivityLogModule,
    SyncModule,
    SupportModule,
    SettingModule,
    BiteboltModule,
    PackageModule,
    CarDetectorModule,
  ],
  providers: [],
})
export class AppModule {}
