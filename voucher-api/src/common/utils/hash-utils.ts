import bcrypt from 'bcrypt';
import * as crypto from 'crypto';

/**
 * generate hash from password or string
 * @param {string} password
 * @returns {string}
 */
export function generateHash(password: string): string {
  return bcrypt.hashSync(password, 10);
}

/**
 * validate text with hash
 * @param {string} password
 * @param {string} hash
 * @returns {Promise<boolean>}
 */
export function validateHash(
  password: string | undefined,
  hash: string | undefined | null,
): Promise<boolean> {
  if (!password || !hash) {
    return Promise.resolve(false);
  }

  return bcrypt.compare(password, hash);
}

export function generateSignature(data: string, salt: string) {
  // Combine data and salt
  const combinedData = Buffer.concat([Buffer.from(data), Buffer.from(salt)]);

  // Create a SHA256 hash
  const hash = crypto.createHash('sha256');
  hash.update(combinedData);

  // Digest the hash into a hex string
  const signature = hash.digest('hex');

  return signature;
}
