import { classes } from '@automapper/classes';
import { AutomapperModule } from '@automapper/nestjs';
import { HttpModule } from '@nestjs/axios';
import { CacheModule } from '@nestjs/cache-manager';
import type { MiddlewareConsumer, NestModule, Provider } from '@nestjs/common';
import { Global, Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import * as redisStore from 'cache-manager-ioredis';

import { MqttModule } from '../modules/mqtt';
import { DetectMobileMiddleware } from './middlewares/detect-device.middleware';
import { LoggerMiddleware } from './middlewares/logger.middleware';
import { TranslationProfile } from './profiles/translation.profile';
import customProviders from './providers/custom-provider';
import { ApiConfigService } from './services/api-config.service';
import { CacheService } from './services/cache.service';
import { DetectorService } from './services/detector.service';
import { FCMService } from './services/fcm.service';
import { GeneratorService } from './services/generator.service';
import { BaseHttpService } from './services/http.service';
import { LocalizeService } from './services/localize.service';
import { LoggerService } from './services/logger.service';
import { OtpService } from './services/otp.service';
import { S3Service } from './services/s3.service';
import { TranslationService } from './services/translation.service';
import { UploadService } from './services/upload.service';
import { ValidatorService } from './services/validator.service';
import { VoucherService } from './services/voucher.service';

const providers: Provider[] = [
  ApiConfigService,
  ValidatorService,
  GeneratorService,
  TranslationService,
  LoggerService,
  CacheService,
  OtpService,
  S3Service,
  UploadService,
  BaseHttpService,
  LocalizeService,
  TranslationProfile,
  VoucherService,
  FCMService,
  DetectorService,
  ...customProviders,
];

@Global()
@Module({
  providers,
  imports: [
    CqrsModule,
    AutomapperModule.forRoot({
      strategyInitializer: classes(),
    }),
    CacheModule.registerAsync({
      useFactory: (configService: ApiConfigService) => ({
        store: redisStore,
        host: configService.redis.host,
        port: configService.redis.port,
        db: configService.redis.db,
        ttl: 0,
      }),
      inject: [ApiConfigService],
    }),
    HttpModule.registerAsync({
      useFactory: async (configService: ApiConfigService) => ({
        timeout: configService.httpConfig.timeout,
        maxRedirects: configService.httpConfig.maxRedirects,
      }),
      inject: [ApiConfigService],
    }),
    MqttModule.forRootAsync({
      inject: [ApiConfigService],
      useFactory: async (configService: ApiConfigService) => ({
        host: configService.mqtt.host,
        port: configService.mqtt.port,
        username: configService.mqtt.username,
        password: configService.mqtt.password,
        protocol: configService.mqtt.protocol,
      }),
    }),
  ],
  exports: [...providers, CqrsModule, AutomapperModule],
})
export class SharedModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(LoggerMiddleware, DetectMobileMiddleware).forRoutes('*');
  }
}
