export enum PaymentMethod {
  CASH = 'cash',
  CREDIT = 'credit',
  // STATIC QR
  QR = 'qr',
  TOKEN = 'token',
  // DYNAMIC QR
  QRPAY = 'qrpay',
  // VOUCHER
  VOUCHER_PAID = 'voucher_paid',
  VOUCHER_FREE = 'voucher_free',
}

export enum PaymentProvider {
  GPay = 'gpay',
}
