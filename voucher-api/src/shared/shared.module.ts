import { classes } from '@automapper/classes';
import { AutomapperModule } from '@automapper/nestjs';
import { HttpModule } from '@nestjs/axios';
import { CacheModule } from '@nestjs/cache-manager';
import type { MiddlewareConsumer, NestModule, Provider } from '@nestjs/common';
import { Global, Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import * as redisStore from 'cache-manager-ioredis';

import { LoggerMiddleware } from './middlewares/logger.middleware';
import { ApiConfigService } from './services/api-config.service';
import { AwsS3Service } from './services/aws-s3.service';
import { BeAPIService } from './services/be-api.service';
import { CacheService } from './services/cache.service';
import { GeneratorService } from './services/generator.service';
import { BaseHttpService } from './services/http.service';
import { LoggerService } from './services/logger.service';
import { TranslationService } from './services/translation.service';
import { ValidatorService } from './services/validator.service';

const providers: Provider[] = [
  ApiConfigService,
  ValidatorService,
  AwsS3Service,
  GeneratorService,
  TranslationService,
  LoggerService,
  BaseHttpService,
  CacheService,
  BeAPIService,
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
  ],
  exports: [...providers, CqrsModule, AutomapperModule],
})
export class SharedModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
