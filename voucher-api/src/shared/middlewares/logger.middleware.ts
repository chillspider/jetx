import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

import { TRACE_ID_HEADER } from '../../constants/config';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private logger: Logger = new Logger('HTTP');
  private ignoredPaths: string[] = ['/auth', '/locations', '/healthcheck'];

  use(request: Request, response: Response, next: NextFunction): void {
    const { method, query: queryParams, baseUrl: path } = request;

    // Generate traceId
    const traceId = uuidv4();
    request.headers[TRACE_ID_HEADER] = traceId;
    response.setHeader(TRACE_ID_HEADER, traceId);

    // Skip logging for ignored paths
    if (this.ignoredPaths.some((p) => path.includes(p))) {
      return next();
    }

    // logging request
    setImmediate(async () => {
      const requestLog = {
        method,
        path,
        queryParams,
        body: request.body,
      };
      this.logger.log(
        `[HTTP REQUEST] TraceId [${traceId}]: ${JSON.stringify(requestLog)}`,
      );
    });

    // extracting response's body
    let body = {};
    const chunks: any[] = [];
    const oldEnd = response.end;
    response.end = (chunk) => {
      if (chunk) {
        chunks.push(Buffer.from(chunk));
      }
      body = Buffer.concat(chunks).toString('utf8');
      return oldEnd.call(response, body);
    };

    // logging response
    response.on('finish', async () => {
      return setTimeout(() => {
        const responseLog = {
          method,
          path,
          statusCode: response.statusCode,
          body,
        };
        this.logger.log(
          `[HTTP RESPONSE] TraceId [${traceId}]: ${JSON.stringify(responseLog)}`,
        );
      }, 0);
    });

    next();
  }
}
