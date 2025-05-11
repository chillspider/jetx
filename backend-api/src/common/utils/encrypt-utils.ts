import CryptoJS from 'crypto-js';

/**
 * Encrypts the given data using the provided secret.
 *
 * @param data - The data to be encrypted.
 * @param secret - The secret key used for encryption.
 * @returns The encrypted data as a string.
 */
export function encrypt(data: any, secret: string): string {
  return CryptoJS.AES.encrypt(JSON.stringify(data), secret).toString();
}

/**
 * Decrypts the given data using the provided secret.
 *
 * @param data - The data to be decrypted.
 * @param secret - The secret key used for decryption.
 * @returns The decrypted data as a string.
 */
export function decrypt<T>(data: string, secret: string): T {
  const bytes = CryptoJS.AES.decrypt(data, secret);
  return JSON.parse(bytes.toString(CryptoJS.enc.Utf8)) as T;
}
