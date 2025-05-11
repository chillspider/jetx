import { Injectable } from '@nestjs/common';

import { MaybeType } from '../../../common/types/maybe.type';
import {
  decrypt,
  encrypt,
  getUtcNow,
  minutesToSeconds,
} from '../../../common/utils';
import { CACHE_KEY } from '../../../constants';
import { ApiConfigService } from '../../../shared/services/api-config.service';
import { CacheService } from '../../../shared/services/cache.service';
import { OtpSession } from '../dto/otp-session.dto';
import { OTPSessionEnum } from '../enums/otp-session.enum';

type OtpSessionRequest = {
  name: string;
  type: OTPSessionEnum;
  key: string;
  extra?: Record<string, any>;
  expiredTime?: number;
};

@Injectable()
export class AuthCacheService {
  constructor(
    private readonly _cacheService: CacheService,
    private readonly _configService: ApiConfigService,
  ) {}

  public async setOtpSession({
    name,
    type,
    key,
    extra = {},
  }: OtpSessionRequest): Promise<void> {
    const payload: OtpSession = { key, date: getUtcNow(), ...extra };
    const encrypted = encrypt(payload, this._configService.secretKey);

    const expiredTime = this.expiredTime(type);

    await this._cacheService.set(
      CACHE_KEY.OTP_SESSION(name, type),
      encrypted,
      expiredTime,
    );
  }

  public async getOtpSession(
    name: string,
    type: OTPSessionEnum,
  ): Promise<MaybeType<OtpSession>> {
    const data = await this._cacheService.get<string>(
      CACHE_KEY.OTP_SESSION(name, type),
    );
    if (!data) return;

    return decrypt<OtpSession>(data, this._configService.secretKey);
  }

  public async deleteOtpSession(
    name: string,
    type: OTPSessionEnum,
  ): Promise<void> {
    await this._cacheService.delete(CACHE_KEY.OTP_SESSION(name, type));
  }

  public expiredTime(type: OTPSessionEnum): number {
    const expiredTime =
      type === OTPSessionEnum.VERIFY_EMAIL
        ? this._configService.emailExpirationTime
        : this._configService.otpExpirationTime;

    return minutesToSeconds(expiredTime);
  }

  public async getVerifySession(email: string): Promise<string> {
    const data = await this._cacheService.get<string>(
      CACHE_KEY.VERIFY_SESSION(email),
    );
    if (!data) return;

    return decrypt<string>(data, this._configService.secretKey);
  }

  public async setVerifySession(email: string, token: string): Promise<void> {
    const ttl = 3 * 60; // 3 minutes

    const encrypted = encrypt(token, this._configService.secretKey);
    await this._cacheService.set(
      CACHE_KEY.VERIFY_SESSION(email),
      encrypted,
      ttl,
    );
  }
}
