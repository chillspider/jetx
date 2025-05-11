import * as crypto from 'node:crypto';

import { BadRequestException, Injectable } from '@nestjs/common';

import { W24Error } from '../../../constants/error-code';
import { ApiConfigService } from '../../../shared/services/api-config.service';

@Injectable()
export class EncryptService {
  static ALGO = 'aes-256-cbc';

  constructor(private readonly _config: ApiConfigService) {}

  encryptPassword(password: string): string | null {
    const passwordKey: string | undefined = this._config.encryptor.key;
    const passwordIv: string | undefined = this._config.encryptor.iv;

    if (!passwordKey || !passwordIv) {
      throw new BadRequestException(W24Error.MissingRequiredField('encryptor'));
    }

    if (passwordIv.length !== 16) {
      throw new BadRequestException(W24Error.InvalidField('IV_LENGTH'));
    }

    const cipher = crypto.createCipheriv(
      EncryptService.ALGO,
      passwordKey,
      passwordIv,
    );
    let encrypted: string = cipher.update(password, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return encrypted;
  }

  decryptPassword(encryptedPassword: string): string | null {
    const passwordKey: string | undefined = this._config.encryptor.key;
    const passwordIv: string | undefined = this._config.encryptor.iv;

    if (!passwordKey || !passwordIv) {
      throw new BadRequestException(W24Error.MissingRequiredField('encryptor'));
    }

    if (passwordIv.length !== 16) {
      throw new BadRequestException(W24Error.InvalidField('IV_LENGTH'));
    }

    const decipher = crypto.createDecipheriv(
      EncryptService.ALGO,
      passwordKey,
      passwordIv,
    );
    let decrypted: string = decipher.update(encryptedPassword, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }
}
