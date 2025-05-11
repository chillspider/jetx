import { createSign, createVerify } from 'crypto';
import CryptoJS from 'crypto-js';

export class SecurityUtil {
  constructor() {}

  private static decryptBASE64(data: string): Buffer {
    return Buffer.from(data, 'base64');
  }

  private static encryptBASE64(data: Buffer): string {
    return data.toString('base64');
  }

  public static decryptDes(cryptData: string, key: string): string {
    try {
      const decryptedData = DESCoder.decrypt(cryptData, key);
      return decryptedData;
    } catch (error) {
      throw new Error(`Decryption error, error message: ${error.message}`);
    }
  }

  public static encryptDes(data: string, key: string): string {
    try {
      const encryptedData = DESCoder.encrypt(data, key);
      return encryptedData;
    } catch (error) {
      throw new Error(`Encryption error, error message: ${error.message}`);
    }
  }

  public static signRSA(data: string, privateKey: string): string {
    try {
      const sign = createSign('RSA-SHA1');
      sign.update(Buffer.from(data, 'utf-8'));
      sign.end();
      const signature = sign.sign({
        key: this.decryptBASE64(privateKey),
        format: 'der',
        type: 'pkcs8',
      });
      return this.encryptBASE64(signature);
    } catch (error) {
      throw new Error(`Signature error, error message: ${error.message}`);
    }
  }

  public static verifyRSA(
    data: string,
    publicKey: string,
    sign: string,
  ): boolean {
    try {
      const verify = createVerify('RSA-SHA1');
      verify.update(Buffer.from(data, 'utf-8'));
      verify.end();
      return verify.verify(
        {
          key: this.decryptBASE64(publicKey),
          format: 'der',
          type: 'spki',
        },
        this.decryptBASE64(sign),
      );
    } catch (error) {
      throw new Error(`Check signature error, error message: ${error.message}`);
    }
  }
}

class DESCoder {
  constructor() {}

  private static decryptBASE64(data: string): CryptoJS.lib.WordArray {
    return CryptoJS.enc.Base64.parse(data);
  }

  private static encryptBASE64(data: CryptoJS.lib.WordArray): string {
    return CryptoJS.enc.Base64.stringify(data);
  }

  public static decrypt(data: string, key: string): string {
    const base64Key = this.decryptBASE64(key);
    const decrypted = CryptoJS.DES.decrypt(data, base64Key, {
      mode: CryptoJS.mode.ECB,
      padding: CryptoJS.pad.Pkcs7,
    });
    return decrypted.toString(CryptoJS.enc.Utf8);
  }

  public static encrypt(data: string, key: string): string {
    const base64Key = this.decryptBASE64(key);
    const byteData = CryptoJS.enc.Utf8.parse(data);
    const encrypted = CryptoJS.DES.encrypt(byteData, base64Key, {
      mode: CryptoJS.mode.ECB,
      padding: CryptoJS.pad.Pkcs7,
    });
    return this.encryptBASE64(encrypted.ciphertext);
  }
}
