import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);

/**
 * Returns the current UTC date and time.
 * @returns {Date} The current UTC date and time.
 */
export function getUtcNow(): Date {
  return new Date(new Date().toUTCString());
}

/**
 * Converts minutes to milliseconds.
 * @param minutes - The number of minutes to convert.
 * @returns The equivalent number of milliseconds.
 */
export function minutesToMilliseconds(minutes: number): number {
  return minutes * 60 * 1000;
}

/**
 * Converts minutes to seconds.
 * @param minutes - The number of minutes to convert.
 * @returns The equivalent number of seconds.
 */
export function minutesToSeconds(minutes: number): number {
  return minutes * 60;
}

export function minutesToHours(minutes: number): number {
  return minutes / 60;
}

/**
 * Converts a given date to UTC.
 *
 * @param date - The date to be converted to UTC.
 * @returns The converted UTC date. If an error occurs, returns null.
 */
export function toUtc(date: Date): Date {
  try {
    return dayjs(date).utc().toDate();
  } catch (error) {
    console.error(error);
    return null;
  }
}
