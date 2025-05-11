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

  static UnexpectedError: IW24Error = {
    code: 'UNEXPECTED_ERROR',
    message: 'Lỗi không xác định',
  };

  static TooManyRequests: IW24Error = {
    code: 'TOO_MANY_REQUESTS',
    message: 'Đã gửi quá nhiều yêu cầu',
  };

  static InvalidDateRange: IW24Error = {
    code: 'INVALID_DATE_RANGE',
    message: 'Khoảng thời gian không hợp lệ',
  };

  static InvalidEmail: IW24Error = {
    code: 'INVALID_EMAIL',
    message: 'Email không hợp lệ',
  };

  static UnprocessableContent: IW24Error = {
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

  // ! AUTH
  static InvalidCredentials: IW24Error = {
    code: 'INVALID_CREDENTIALS',
    message: 'Thông tin đăng nhập không chính xác',
  };

  static InvalidAuthCredentials: IW24Error = {
    code: 'INVALID_AUTH_CREDENTIALS',
    message: 'Thông tin xác thực không hợp lệ',
  };

  static InvalidProvider: IW24Error = {
    code: 'INVALID_PROVIDER',
    message: 'Phương thức đăng nhập không hợp lệ',
  };

  static UnsupportedSocialPasswordReset: IW24Error = {
    code: 'UNSUPPORTED_SOCIAL_PASSWORD_RESET',
    message: 'Phương thức đăng nhập không hỗ trợ đặt lại mật khẩu',
  };

  static InvalidOldPassword: IW24Error = {
    code: 'INVALID_OLD_PASSWORD',
    message: 'Mật khẩu cũ không chính xác',
  };

  static InvalidToken: IW24Error = {
    code: 'INVALID_TOKEN',
    message: 'Mã không hợp lệ',
  };

  static InvalidOTP: IW24Error = {
    code: 'INVALID_OTP',
    message: 'Mã OTP không hợp lệ',
  };

  static InvalidSignature: IW24Error = {
    code: 'INVALID_SIGNATURE',
    message: 'Chữ ký không hợp lệ',
  };

  static SessionExpired: IW24Error = {
    code: 'SESSION_EXPIRED',
    message: 'Phiên xử lý đã hết hạn',
  };

  static EmailAlreadyVerified: IW24Error = {
    code: 'EMAIL_ALREADY_VERIFIED',
    message: 'Email đã được xác thực',
  };

  static StatusAlreadyUpdated: IW24Error = {
    code: 'STATUS_ALREADY_UPDATED',
    message: 'Trạng thái tài khoản đã được cập nhật',
  };

  static CannotInactiveSocialUser: IW24Error = {
    code: 'CANNOT_INACTIVE_SOCIAL_USER',
    message: 'Không thể đánh dấu chưa xác thực tài khoản đăng nhập bằng SSO',
  };

  static UserBlocked: IW24Error = {
    code: 'USER_BLOCKED',
    message: 'Tài khoản đã bị khoá',
  };

  static UnsupportedEmailRegister: IW24Error = {
    code: 'UNSUPPORTED_EMAIL_REGISTER',
    message:
      'Không chấp nhận đăng ký mới thông qua email - Xin dùng các phương thức khác',
  };

  // ! ORDER
  static InvalidPaymentMethod: IW24Error = {
    code: 'INVALID_PAYMENT_METHOD',
    message: 'Phương thức thanh toán không hợp lệ',
  };

  static InvalidPaymentProvider: IW24Error = {
    code: 'INVALID_PAYMENT_PROVIDER',
    message: 'Nhà cung cấp thanh toán không hợp lệ',
  };

  static PaymentMethodUnsupported: IW24Error = {
    code: 'PAYMENT_METHOD_UNSUPPORTED',
    message: 'Phương thức thanh toán không được hỗ trợ',
  };

  static DeviceNotAvailable: IW24Error = {
    code: 'DEVICE_NOT_AVAILABLE',
    message: 'Thiết bị không khả dụng',
  };

  static OrderChanged: IW24Error = {
    code: 'ORDER_CHANGED',
    message: 'Giá trị đơn hàng đã thay đổi',
  };

  static VoucherInvalid: IW24Error = {
    code: 'VOUCHER_INVALID',
    message: 'Mã giảm không hợp lệ',
  };

  static InvalidOperation: IW24Error = {
    code: 'INVALID_OPERATION',
    message: 'Thao tác không hợp lệ',
  };

  static CreatePaymentFailed: IW24Error = {
    code: 'CREATE_PAYMENT_FAILED',
    message: 'Tạo giao dịch thanh toán thất bại',
  };

  static ModeInvalid: IW24Error = {
    code: 'MODE_INVALID',
    message: 'Chế độ rửa không hợp lệ',
  };

  static PendingTransaction: IW24Error = {
    code: 'PENDING_TRANSACTION',
    message: 'Có giao dịch đang chờ xử lý',
  };

  static TransactionExpired: IW24Error = {
    code: 'Transaction_EXPIRED',
    message: 'Giao dịch đã hết hạn',
  };

  static AmountNotEnough: IW24Error = {
    code: 'AMOUNT_NOT_ENOUGH',
    message: 'Số tiền không đủ',
  };

  static OrderStatusInvalid: IW24Error = {
    code: 'ORDER_STATUS_INVALID',
    message: 'Trạng thái đơn hàng không hợp lệ',
  };

  static InvalidCancellationMethod: IW24Error = {
    code: 'INVALID_CANCELLATION_METHOD',
    message: 'Phương thức thanh toán không hỗ trợ huỷ',
  };

  // ! PACKAGE
  static PackageAccessDenied: IW24Error = {
    code: 'PACKAGE_ACCESS_DENIED',
    message: 'Không có quyền truy cập gói dịch vụ',
  };

  // ! Membership
  static MembershipInUse: IW24Error = {
    code: 'MEMBERSHIP_IN_USE',
    message: 'Gói dịch vụ đang được sử dụng',
  };

  // ! STATION
  static StationIsProcessing: IW24Error = {
    code: 'STATION_IS_PROCESSING',
    message: 'Trạm đang có máy rửa đang xử lý',
  };

  // ! INVOICE
  static InvoiceNotCompleted: IW24Error = {
    code: 'INVOICE_NOT_COMPLETED',
    message: 'Hóa đơn chưa hoàn tất',
  };

  // ! NOTIFICATION
  static CampaignAlreadySent: IW24Error = {
    code: 'CAMPAIGN_ALREADY_SENT',
    message: 'Thông báo đã được gửi',
  };

  static CampaignIsProcessing: IW24Error = {
    code: 'CAMPAIGN_IS_PROCESSING',
    message: 'Thông báo đang được xử lý',
  };

  // ! VOUCHER
  static VoucherOwnerInvalid: IW24Error = {
    code: 'VOUCHER_OWNER_INVALID',
    message: 'Mã giảm không thuộc tài khoản của bạn',
  };

  static VoucherTypeInvalid: IW24Error = {
    code: 'VOUCHER_TYPE_INVALID',
    message: 'Mã giảm không hợp lệ',
  };

  static VoucherProfileInvalid: IW24Error = {
    code: 'VOUCHER_PROFILE_INVALID',
    message: 'Mã giảm không hợp lệ',
  };

  static VoucherStatusInvalid: IW24Error = {
    code: 'VOUCHER_STATUS_INVALID',
    message: 'Mã giảm không hợp lệ',
  };

  static VoucherExpired: IW24Error = {
    code: 'VOUCHER_EXPIRED',
    message: 'Mã giảm đã hết hạn',
  };

  static VoucherNotActiveYet: IW24Error = {
    code: 'VOUCHER_NOT_ACTIVE_YET',
    message: 'Mã giảm chưa tới thời gian có hiệu lực',
  };

  static VoucherExcludedTime: IW24Error = {
    code: 'VOUCHER_EXCLUDED_TIME',
    message: 'Mã giảm không được áp dụng trong khoảng thời gian này',
  };

  static VoucherMinOrderValue: IW24Error = {
    code: 'VOUCHER_MIN_ORDER_VALUE',
    message: 'Giá trị đơn hàng không đủ để sử dụng mã giảm',
  };

  static VoucherStationInvalid: IW24Error = {
    code: 'VOUCHER_STATION_INVALID',
    message: 'Mã giảm không được áp dụng cho trạm này',
  };

  static VoucherDeviceInvalid: IW24Error = {
    code: 'VOUCHER_DEVICE_INVALID',
    message: 'Mã giảm không được áp dụng cho máy rửa này',
  };

  static VoucherModeInvalid: IW24Error = {
    code: 'VOUCHER_MODE_INVALID',
    message: 'Mã giảm không được áp dụng cho chế độ rửa này',
  };
}
