/* eslint-disable @typescript-eslint/naming-convention */
export class CACHE_KEY {
  // ! NFLOW
  static NFLOW_ACCESS_TOKEN = 'NFLOW_ACCESS_TOKEN';
  // ! B2B VOUCHER
  static B2B_REDEEM_CODE = (code: string) => `B2B_REDEEM_CODE:${code}`;
}
