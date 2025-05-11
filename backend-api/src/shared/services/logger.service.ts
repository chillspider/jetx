import { ConsoleLogger, HttpException, Injectable } from '@nestjs/common';
import { RequestContext } from 'nestjs-request-context';
import * as winston from 'winston';

import { TRACE_ID_HEADER } from '../../constants/config';
import { ApiConfigService } from './api-config.service';

@Injectable()
export class LoggerService extends ConsoleLogger {
  private readonly _logger: winston.Logger;

  constructor(private readonly _configService: ApiConfigService) {
    super(LoggerService.name);
    this._logger = winston.createLogger(this._configService.winstonConfig);
    if (!_configService.isProduction) {
      this._logger.debug('Logging initialized at debug level');
    }
  }
  log(message: string): void {
    this._logger.info(message);
  }
  info(message: string): void {
    this._logger.info(message);
  }
  debug(message: string): void {
    this._logger.debug(message);
  }
  error(context?: string | HttpException): void {
    const req = RequestContext?.currentContext?.req;
    const traceId = req?.headers?.[TRACE_ID_HEADER];

    console.error(
      traceId ? `[ERROR] TraceId [${traceId}]: ${context}` : context,
    );
  }
  warn(message: string): void {
    this._logger.warn(message);
  }
}
