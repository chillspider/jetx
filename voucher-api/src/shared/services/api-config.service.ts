import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { ThrottlerOptions } from '@nestjs/throttler';
import type { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { isNil } from 'lodash';
import type { Units } from 'parse-duration';
import { default as parse } from 'parse-duration';
import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

import { NullableType } from '../../common/types/nullable.type';
import { LIMIT_IMAGE_SIZE } from '../../constants/config';
import { ISwaggerConfigInterface } from '../../interfaces';
import { SnakeNamingStrategy } from '../../snake-naming.strategy';

@Injectable()
export class ApiConfigService {
  constructor(private configService: ConfigService) {}

  get isDevelopment(): boolean {
    return this.nodeEnv === 'development';
  }

  get isProduction(): boolean {
    return this.nodeEnv === 'production';
  }

  get isTest(): boolean {
    return this.nodeEnv === 'test';
  }

  private getNumber(key: string): NullableType<number> {
    const value = this.get(key);

    try {
      return Number(value);
    } catch {
      return null;
    }
  }

  private getDuration(key: string, format?: Units): NullableType<number> {
    const value = this.getString(key);
    const duration = parse(value, format);

    if (duration === undefined) {
      return null;
    }

    return duration;
  }

  private getBoolean(key: string): boolean {
    const value = this.get(key);

    try {
      return Boolean(JSON.parse(value));
    } catch {
      return false;
    }
  }

  private getString(key: string): string {
    const value = this.get(key);

    return value.replaceAll('\\n', '\n');
  }

  get nodeEnv(): string {
    return this.getString('NODE_ENV');
  }

  get fallbackLanguage(): string {
    return this.getString('FALLBACK_LANGUAGE');
  }

  get throttlerConfigs(): ThrottlerOptions {
    return {
      ttl: this.getDuration('THROTTLER_TTL', 'second') || 60, // Default TTL to 60 seconds if not specified
      limit: this.getNumber('THROTTLER_LIMIT') || 10, // Default limit to 10 requests if not specified
      // storage: new ThrottlerStorageRedisService(new Redis(this.redis)),
    };
  }

  get postgresConfig(): TypeOrmModuleOptions {
    const entities = [__dirname + '/../../modules/**/*.entity{.ts,.js}'];
    const migrations = [__dirname + '/../../database/migrations/*{.ts,.js}'];
    const subscribers = [
      __dirname + '/../../entity-subscribers/*.subscriber{.ts,.js}',
    ];

    return {
      entities,
      migrations,
      subscribers,
      keepConnectionAlive: !this.isTest,
      dropSchema: this.isTest,
      type: 'postgres',
      host: this.getString('DB_HOST'),
      port: this.getNumber('DB_PORT') || 3000,
      username: this.getString('DB_USERNAME'),
      password: this.getString('DB_PASSWORD'),
      database: this.getString('DB_DATABASE'),
      migrationsRun: false,
      logging: this.getBoolean('ENABLE_ORM_LOGS'),
      namingStrategy: new SnakeNamingStrategy(),
    };
  }

  get s3Config() {
    return {
      bucket: this.getString('S3_BUCKET'),
      endpoint: this.getString('S3_ENDPOINT'),
      accessKeyId: this.getString('S3_ACCESS_KEY'),
      secretAccessKey: this.getString('S3_SECRET_KEY'),
      region: this.getString('S3_REGION'),
      compressImageQuality: this.getNumber('COMPRESS_IMAGE_QUALITY') || 100,
      maxImageSize: this.getNumber('MAX_IMAGE_SIZE') || LIMIT_IMAGE_SIZE,
    };
  }

  get documentationEnabled(): boolean {
    return this.getBoolean('ENABLE_DOCUMENTATION');
  }

  get natsEnabled(): boolean {
    return this.getBoolean('NATS_ENABLED');
  }

  get natsConfig() {
    return {
      host: this.getString('NATS_HOST'),
      port: this.getNumber('NATS_PORT'),
    };
  }

  get authConfig() {
    return {
      privateKey: this.getString('JWT_PRIVATE_KEY'),
      publicKey: this.getString('JWT_PUBLIC_KEY'),
      jwtExpirationTime: this.getNumber('JWT_EXPIRATION_TIME'),
    };
  }

  get appConfig() {
    return {
      port: this.getString('PORT') || 3000,
      host: this.getString('HOST') || '127.0.0.1',
      origin: this.getString('ORIGIN') || '*',
    };
  }

  get swaggerConfig(): ISwaggerConfigInterface {
    return {
      path: this.get('SWAGGER_PATH') || '',
      title: this.get('SWAGGER_TITLE') || 'WASH24 API',
      description: this.get('SWAGGER_DESCRIPTION') || '',
      version: this.get('SWAGGER_VERSION') || '0.0.1',
      scheme: this.get('SWAGGER_SCHEME') === 'https' ? 'https' : 'http',
    };
  }

  get autoCloseApplication(): boolean {
    return this.get('AUTO_CLOSE') === 'true';
  }

  get appleConfig() {
    return {
      appAudience: this.getString('APPLE_APP_AUDIENCE'),
    };
  }

  get googleConfig() {
    return {
      clientId: this.getString('GOOGLE_CLIENT_ID'),
      clientSecret: this.getString('GOOGLE_CLIENT_SECRET'),
    };
  }

  get winstonConfig(): winston.LoggerOptions {
    return {
      transports: [
        new DailyRotateFile({
          level: 'debug',
          filename: `./logs/${this.nodeEnv}/debug-%DATE%.log`,
          datePattern: 'YYYY-MM-DD',
          zippedArchive: true,
          maxSize: '20m',
          maxFiles: '14d',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json(),
          ),
        }),
        new DailyRotateFile({
          level: 'error',
          filename: `./logs/${this.nodeEnv}/error-%DATE%.log`,
          datePattern: 'YYYY-MM-DD',
          zippedArchive: false,
          maxSize: '20m',
          maxFiles: '30d',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json(),
          ),
        }),
        new winston.transports.Console({
          level: 'debug',
          handleExceptions: true,
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.timestamp({
              format: 'DD-MM-YYYY HH:mm:ss',
            }),
            winston.format.simple(),
          ),
        }),
      ],
      exitOnError: false,
    };
  }

  get autoMigration(): boolean {
    return this.getBoolean('AUTO_MIGRATION');
  }

  get enableSeeding() {
    return this.getBoolean('ENABLE_SEEDING');
  }

  get moduleType() {
    return this.get('MODULE_TYPE') || 'voucher';
  }

  get redis() {
    return {
      host: this.get('REDIS_HOST') || 'localhost',
      port: this.getNumber('REDIS_PORT') || 6379,
      pass: this.get('REDIS_PASSWORD'),
      db: this.getNumber('REDIS_DB') || 0,
    };
  }

  get secretKey() {
    return this.getString('SECRET_KEY');
  }

  get httpConfig() {
    return {
      timeout: this.getNumber('HTTP_TIMEOUT') || 3000,
      maxRedirects: this.getNumber('HTTP_MAX_REDIRECTS') || 50,
    };
  }

  public get(key: string): string {
    const value = this.configService.get<string>(key);

    if (isNil(value)) {
      return '';
    }

    return value;
  }

  get nflow() {
    return {
      username: this.getString('NFLOW_USERNAME'),
      password: this.getString('NFLOW_PASSWORD'),
      clientId: this.getString('NFLOW_CLIENT_ID'),
      keycloakUrl: this.getString('NFLOW_KEYCLOAK_URL'),
      baseUrl: this.getString('NFLOW_BASE_URL'),
    };
  }

  get saltKey() {
    return this.getString('SALT_KEY');
  }

  get beAPI() {
    return {
      url: this.getString('BE_API_URL'),
      secret: this.getString('BE_API_SECRET'),
    };
  }
}
