import { isEmail } from 'class-validator';
import { snakeCase } from 'lodash';

import { defaultLanguageCode, LanguageCode } from '../../constants';
import { StationLocationEntity } from '../../modules/station/entities/station-location.entity';
import { LocationPoint } from '../types/location-point.type';

export function getVariableName<TResult>(
  getVar: () => TResult,
): string | undefined {
  const m = /\(\)=>(.*)/.exec(
    getVar.toString().replaceAll(/(\r\n|\n|\r|\s)/gm, ''),
  );

  if (!m) {
    throw new Error(
      "The function does not contain a statement matching 'return variableName;'",
    );
  }

  const fullMemberName = m[1]!;

  const memberParts = fullMemberName.split('.');

  return memberParts.at(-1);
}

// Convert degrees to radians
export function toRadians(degree: number): number {
  return degree * (Math.PI / 180);
}

/**
 * Calculates the distance in kilometers between two location points.
 * @param from - The starting location point.
 * @param to - The ending location point.
 * @returns The distance in kilometers between the two location points.
 */
export function getDistance(from: LocationPoint, to: LocationPoint) {
  // Radius of the Earth in kilometers
  const R = 6371;

  const dLat = toRadians(to.latitude - from.latitude);
  const dLng = toRadians(to.longitude - from.longitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(from.latitude)) *
      Math.cos(toRadians(to.latitude)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  // Distance in kilometers
  const distanceKilometers = R * c;
  return distanceKilometers;
}

export function getAddressString(location: StationLocationEntity): string {
  if (!location) return '';

  return `${location.address ?? ''}, ${location.ward ?? ''}, ${location.district ?? ''}, ${location.city ?? ''}`;
}

/**
 * Checks if a string has a delete mark.
 *
 * @param value - The string to check.
 * @returns A boolean indicating whether the string has a delete mark.
 */
export function hasDeletedMark(value: string) {
  const deleteMarkRegex = /:deleted:\d{13}$/;
  return deleteMarkRegex.test(value);
}

/**
 * Marks a value as deleted by appending ":deleted:" and the current timestamp.
 * @param value - The value to mark as deleted.
 * @returns The marked value.
 */
export function markAsDeleted(value: string): string {
  return `${value}:deleted:${Date.now()}`;
}

/**
 * Retrieves the LanguageCode from a given language string.
 *
 * @param lang - The language string to convert to LanguageCode.
 * @returns The corresponding LanguageCode or defaultLanguageCode if not found.
 */
export function getLanguageCode(lang: string): LanguageCode {
  const code = Object.values(LanguageCode).find((l) => l === lang);
  return code ?? defaultLanguageCode;
}

/**
 * Retries a function with exponential backoff and optional jitter.
 * @param fn - The function to retry.
 * @param retries - The number of retry attempts.
 * @param delay - The initial delay in milliseconds.
 * @param onRetry - Optional callback to execute on each retry attempt.
 * @param jitter - Optional jitter factor to add randomness to the delay.
 * @returns The result of the function if successful.
 * @throws The error if all retry attempts fail.
 */
export async function retry<T>(
  fn: () => Promise<T>,
  retries: number = 3,
  delay: number = 1000, // Initial delay in milliseconds
  onRetry?: (attempt: number, error: any) => void,
  jitter: number = 0.1, // Jitter factor (0.1 means up to 10% random variation)
): Promise<T> {
  const MAX_DELAY = 20000; // Maximum delay of 20 seconds
  let attempt = 0;

  while (attempt <= retries) {
    try {
      return await fn();
    } catch (error) {
      if (attempt < retries) {
        attempt++;
        if (onRetry) {
          onRetry(attempt, error);
        }

        // Calculate the delay with exponential backoff and optional jitter
        let dynamicDelay = delay * Math.pow(2, attempt);
        if (jitter > 0) {
          const jitterValue = dynamicDelay * jitter * (Math.random() - 0.5);
          dynamicDelay += jitterValue;
        }

        // Cap the delay at MAX_DELAY
        dynamicDelay = Math.min(dynamicDelay, MAX_DELAY);

        await sleep(dynamicDelay);
      } else {
        throw error;
      }
    }
  }
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function isPositiveNumber(value?: number): boolean {
  return typeof value === 'number' && value >= 0;
}

export function formattedName(firstName?: string, lastName?: string): string {
  return `${firstName ?? ''} ${lastName ?? ''}`.trim();
}

/**
 * Removes diacritics from a given string.
 * @param str - The input string.
 * @returns The string without diacritics.
 */
export function removeDiacritics(str: string): string {
  if (!str) return str;

  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .normalize('NFC');
}

export function formattedFileName(str: string): string {
  return snakeCase(removeDiacritics(str));
}

export function shortenText(text: string, maxLength: number = 25): string {
  if (!text) return text;
  return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
}

/**
 * Removes invalid characters from a given string.
 *
 * Regex Pattern:
 * - \p{L}: Matches any kind of letter from any language.
 * - \p{N}: Matches any kind of numeric character.
 * - \p{Zs}: Matches space separators.
 * - \u0300-\u036f: Matches combining diacritical marks (used for accented Vietnamese characters).
 * - \u1ea0-\u1ef9: Matches precomposed Vietnamese characters (e.g., ạ, ế, ỏ).
 *
 * Normalization:
 * - normalize('NFD'): Decomposes characters into base characters and combining marks.
 * - normalize('NFC'): Reconstructs characters into their composed form.
 *
 * @param str - The input string to be processed.
 * @returns The processed string with invalid characters removed.
 */
export function removeInvalidChars(str: string): string {
  if (!str) return str;
  const regex = /[^\p{L}\p{N}\p{Zs}\u0300-\u036f\u1ea0-\u1ef9]/gu;
  return str.normalize('NFD').replace(regex, '').normalize('NFC');
}

/**
 * Normalizes an email address by removing any unnecessary characters and converting to lowercase.
 * @param email - The email address to be normalized.
 * @returns The normalized email address.
 */
export function normalizeEmail(email: string): string {
  try {
    if (!isEmail(email)) {
      return email.toLowerCase().trim();
    }

    const [localPart, domain] = email.split('@');
    const normalizedLocalPart = localPart.split('+')[0].trim();
    return `${normalizedLocalPart}@${domain}`.toLowerCase().trim();
  } catch (_) {
    return email.toLowerCase().trim();
  }
}

/**
 * Masks a given string by replacing characters with asterisks.
 *
 * This function masks a string by replacing characters with asterisks, except for the first and last 'n' characters.
 * The number of asterisks is determined by the length of the string and the value of 'n'.
 *
 * @param str - The input string to be masked.
 * @returns The masked string.
 */
export function maskString(str: string): string {
  if (!str) return str;

  const length = str.length;
  if (length < 3) return '***';

  const n = Math.min(3, Math.floor((length - 1) / 2));
  const asteriskCount = Math.max(length - n * 2, 3); // Ensure at least 3 asterisks
  return str.slice(0, n) + '*'.repeat(asteriskCount) + str.slice(-n);
}

/**
 * Masks an email address by replacing the local part with asterisks.
 * @param email - The email address to be masked.
 * @returns The masked email address.
 */
export function maskEmail(email: string): string {
  if (!email || !isEmail(email)) return email;

  const [local = '', domain = ''] = email.split('@');
  return `${maskString(local)}@${domain}`;
}
