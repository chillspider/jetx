import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Response } from 'express';

@Injectable()
export class DetectMobileMiddleware implements NestMiddleware {
  use(req: any, _: Response, next: NextFunction) {
    const userAgent = req?.headers?.['user-agent'];

    if (userAgent) {
      if (/android/i.test(userAgent)) {
        req['device'] = 'android';
      } else if (
        /iPhone|iPad|iPod/i.test(userAgent) ||
        /CFNetwork\/|Darwin\//i.test(userAgent)
      ) {
        req['device'] = 'ios';
      } else {
        req['device'] = 'unknown';
      }
    }

    next();
  }
}
