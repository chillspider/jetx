export interface IYglResponse {
  traceId: string; // "20210719100000000001"
  success: boolean;
  resultCode: string; // "SUCCESS"
  errorMsg?: string;
  extInfo?: any;
  resultInfo?: any; // {}
}
