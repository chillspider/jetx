export enum OrderStatusEnum {
  /// Common
  DRAFT = 'draft',
  COMPLETED = 'completed',
  CANCELED = 'canceled',
  FAILED = 'failed',
  REFUNDED = 'refunded',

  /// Waiting for start washing machine || waiting for confirm FNB order
  PENDING = 'pending',
  /// Washing is in progress || FNB order is processing
  PROCESSING = 'processing',

  // ! Washing
  /// Washing machine is stopped by abnormal reason
  ABNORMAL_STOP = 'abnormal_stop',
  /// Washing machine is stopped by self
  SELF_STOP = 'self_stop',

  // ! FNB
  /// Order is rejected
  REJECTED = 'rejected',

  UNKNOWN = 'unknown',
}

export const FailedOrderStatuses = [
  OrderStatusEnum.CANCELED,
  OrderStatusEnum.FAILED,
  OrderStatusEnum.REFUNDED,
  OrderStatusEnum.ABNORMAL_STOP,
  OrderStatusEnum.SELF_STOP,
  OrderStatusEnum.REJECTED,
];
