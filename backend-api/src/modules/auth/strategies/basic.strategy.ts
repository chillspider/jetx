import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { BasicStrategy as Strategy } from 'passport-http';

import { AUTH_BASIC_SERVICE_KEY } from '../../../decorators/basic-service.decorator';
import { ApiConfigService } from '../../../shared/services/api-config.service';

@Injectable()
export class BasicStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ApiConfigService,
    private readonly reflector: Reflector,
  ) {
    super({
      passReqToCallback: true,
    });
  }

  public validate = (
    req: Request,
    username: string,
    password: string,
  ): boolean => {
    const service = this.getService(req);

    let userKey = 'BASIC_USER';
    let passKey = 'BASIC_PASS';

    if (service) {
      userKey = `${service.toUpperCase()}_` + userKey;
      passKey = `${service.toUpperCase()}_` + passKey;
    }

    if (
      this.configService.get(userKey) === username &&
      this.configService.get(passKey) === password
    ) {
      return true;
    }

    throw new UnauthorizedException();
  };

  private getService(req: Request): string {
    try {
      const handler = req.route?.stack?.[0]?.handle;
      return this.reflector.get<string>(AUTH_BASIC_SERVICE_KEY, handler);
    } catch (error) {
      return null;
    }
  }
}
