import { Injectable } from '@nestjs/common';
import * as speakeasy from 'speakeasy';

@Injectable()
export class OtpService {
  constructor() {}

  public generateSecretKey(): string {
    return speakeasy.generateSecret().base32;
  }

  public generateOtp(secret: string, step: number): string {
    const otpObject: speakeasy.TotpOptions = {
      secret: secret,
      encoding: 'base32',
      step: step,
    };

    const otp = speakeasy.totp(otpObject);
    return otp;
  }

  public verifyOtp(otp: string, secret: string, step: number): boolean {
    const otpObject: speakeasy.TotpVerifyOptions = {
      secret: secret,
      encoding: 'base32',
      token: otp,
      step: step,
      window: 1,
    };

    return speakeasy.totp.verify(otpObject);
  }
}
