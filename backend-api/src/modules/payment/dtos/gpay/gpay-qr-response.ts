export enum GPayQRResCode {
  SUCCESS = '000',
  PROCESSING = '900',
  FAIL = '901',
  SYS_ERROR = '999',
  TOKEN_INVALID = '170',
  TOKEN_EXPIRE = '171',
}

export class GPayQRResponse<T> {
  resCode: GPayQRResCode;
  resMessage: string;
  resData: T;
}

export class GPayQRInfo {
  qrInfo: string;
  bankId: string;
  bankName: string;
  binCode: string;
  accountNo: string;
  accountName: string;
  status?: string; /// OPEN, CLOSED
  refNo?: string;
  transactionInfo?: Array<{
    banktransID?: string;
    status?: string;
    transactionAmount?: string;
    transactionDate?: string;
  }>;
}
