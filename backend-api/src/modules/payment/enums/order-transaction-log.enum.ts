export enum OrderTransactionLogType {
  PaymentReq = 'PAYMENT_REQUEST',
  PaymentRes = 'PAYMENT_RESPONSE',
  PaymentError = 'PAYMENT_ERROR',
  RefundReq = 'REFUND_REQUEST',
  RefundRes = 'REFUND_RESPONSE',

  WebhookPaymentReq = 'WEBHOOK_PAYMENT_REQUEST',
  WebhookRefundReq = 'WEBHOOK_REFUND_REQUEST',

  WebhookQRPaymentReq = 'WEBHOOK_QR_PAYMENT_REQUEST',
  WebhookQRPaymentError = 'WEBHOOK_QR_PAYMENT_ERROR',

  VoidReq = 'VOID_REQUEST',
  VoidRes = 'VOID_RESPONSE',
}
