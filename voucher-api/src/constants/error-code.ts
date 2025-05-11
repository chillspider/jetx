import { constantCase, noCase, sentenceCase } from 'change-case';

export interface IW24Error {
  code: string;
  message: string;
}

export class W24Error {
  // ! COMMON
  static NotFound = (field: string): IW24Error => ({
    code: `${constantCase(field)}_NOT_FOUND`,
    message: `${sentenceCase(field)} không tồn tại`,
  });

  static AlreadyExists = (field: string): IW24Error => ({
    code: `${constantCase(field)}_ALREADY_EXISTS`,
    message: `${sentenceCase(field)} đã tồn tại`,
  });

  static UnexpectedError: W24Error = {
    code: 'UNEXPECTED_ERROR',
    message: 'Lỗi không xác định',
  };

  static UnprocessableContent: W24Error = {
    code: 'UNPROCESSABLE_CONTENT',
    message: 'Nội dung yêu cầu không xử lý được',
  };

  static MissingRequiredField = (field: string): IW24Error => ({
    code: `MISSING_${constantCase(field)}`,
    message: `Thiếu trường bắt buộc: ${noCase(field)}`,
  });

  static InvalidField = (field: string): IW24Error => ({
    code: `INVALID_${constantCase(field)}`,
    message: `Trường không hợp lệ: ${noCase(field)}`,
  });

  static VoucherCodeInvalid: W24Error = {
    code: 'VOUCHER_CODE_INVALID',
    message: 'Mã giảm giá không hợp lệ',
  };

  static VoucherCodeExpired: IW24Error = {
    code: 'VOUCHER_CODE_EXPIRED',
    message: 'Mã giảm giá đã hết hạn',
  };

  static VoucherCodeNotActiveYet: IW24Error = {
    code: 'VOUCHER_CODE_NOT_ACTIVE_YET',
    message: 'Mã giảm giá chưa tới thời gian có hiệu lực',
  };

  static InvalidSignature: IW24Error = {
    code: 'INVALID_SIGNATURE',
    message: 'Chữ ký không hợp lệ',
  };

  static ToManyRequests: IW24Error = {
    code: 'TO_MANY_REQUESTS',
    message: 'Quá nhiều yêu cầu',
  };
}
