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
 * Converts a given date to UTC.
 *
 * @param date - The date to be converted to UTC.
 * @returns The converted UTC date. If an error occurs, returns null.
 */
export function toUtc(date: Date): Date {
  if (!date) return null;

  try {
    return dayjs(date).utc().toDate();
  } catch (error) {
    console.error(error);
    return null;
  }
}
