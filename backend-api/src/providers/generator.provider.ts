import { v4 as uuid } from 'uuid';

export class GeneratorProvider {
  static uuid(): string {
    return uuid();
  }

  static fileName(ext: string): string {
    return GeneratorProvider.uuid() + '.' + ext;
  }

  static getS3PublicUrl(key: string): string {
    if (!key) return '';

    if (key.startsWith('http')) return key;

    return `${process.env.S3_ENDPOINT}/${process.env.S3_BUCKET}/${key}`;
  }

  static getS3Key(publicUrl: string): string {
    if (!publicUrl) return publicUrl;

    const exec = new RegExp(
      `(?<=${process.env.S3_ENDPOINT}/${process.env.S3_BUCKET}/).*`,
    ).exec(publicUrl);

    if (!exec) return publicUrl;

    return exec[0];
  }

  static getBBS3PublicUrl(key: string): string {
    if (!key) return '';
    if (key.startsWith('http')) return key;

    return `${process.env.BITEBOLT_S3_URL}/${key}`;
  }

  static generateVerificationCode(): string {
    return Math.floor(1000 + Math.random() * 9000).toString();
  }

  static generatePassword(): string {
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = lowercase.toUpperCase();
    const numbers = '0123456789';

    let text = '';

    for (let i = 0; i < 4; i++) {
      text += uppercase.charAt(Math.floor(Math.random() * uppercase.length));
      text += lowercase.charAt(Math.floor(Math.random() * lowercase.length));
      text += numbers.charAt(Math.floor(Math.random() * numbers.length));
    }

    return text;
  }

  /**
   * generate random string
   * @param length
   */
  static generateRandomString(length: number): string {
    return Math.random()
      .toString(36)
      .replaceAll(/[^\dA-Za-z]+/g, '')
      .slice(0, Math.max(0, length));
  }

  static alphabet =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  static generateReferralCode(size: number = 8): string {
    const alphabet = GeneratorProvider.alphabet;

    let code = '';
    let index = size;

    while (index--) {
      code += alphabet[(Math.random() * alphabet.length) | 0];
    }

    return code;
  }
}
