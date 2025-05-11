import { OTPSessionEnum } from '../modules/auth/enums/otp-session.enum';

/* eslint-disable @typescript-eslint/naming-convention */
export class CACHE_KEY {
  // ! AUTH
  static OTP_SESSION = (name: string, type: OTPSessionEnum) =>
    `otp-session:${type}:${name}`;

  static VERIFY_SESSION = (email: string) => `verify-session:${email}`;

  // ! LOCATION
  static LOCATION_CITY = (key: string) => `location:city:${key}`;
  static LOCATION_DISTRICT = (key: string) => `location:district:${key}`;
  static LOCATION_WARD = (key: string) => `location:ward:${key}`;
  static LOCATION_COUNTRY = 'location:country';

  // ! STATION
  static STATIONS = 'stations';

  // ! NFLOW
  static NFLOW_ACCESS_TOKEN = 'access-token:nflow';
  static QR_ACCESS_TOKEN = 'access-token:qr';

  static PACKAGES = 'packages';
}
