import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

import { generateSignature } from '../common/utils';
import { W24Error } from '../constants/error-code';
import { ApiConfigService } from '../shared/services/api-config.service';

@Injectable()
export class SignatureGuard implements CanActivate {
  constructor(private readonly _configService: ApiConfigService) {}
  canActivate(context: ExecutionContext): boolean {
    const { headers, body } = context.switchToHttp().getRequest();

    const signature = headers?.signature;
    if (!signature) {
      throw new ForbiddenException(W24Error.InvalidSignature);
    }

    const verifySignature = generateSignature(
      JSON.stringify(body),
      this._configService.secretKey,
    );

    const isValidSignature = signature === verifySignature;
    if (!isValidSignature) {
      throw new ForbiddenException(W24Error.InvalidSignature);
    }

    return isValidSignature;
  }
}
