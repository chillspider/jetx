export const EVENT = {
  LOCATION: {
    SET_COUNTRY: 'location.set_country',
    SET_CITY: 'location.set_city',
    SET_DISTRICT: 'location.set_district',
    SET_WARD: 'location.set_ward',
  },
  STATION: {
    SYNC: 'station.sync',
    SET: 'station.set',
    UPDATE_DEVICE: 'station.update_device',
  },
  ORDER_TRANSACTION: {
    LOG: 'order_transaction.log',
  },
  ORDER: {
    START_DEVICE: 'order.start_device',
    CHECK_STATUS: 'order.check_status',
    COMPLETED: 'order.completed',
    NOTIFICATION: 'order.notification',
    REFUND: 'order.refund',
    ALLOCATE_PACKAGE_STATION: 'order.allocate_package_station',
  },
  MEMBERSHIP: {
    UPDATE_EXPIRED: 'membership.update_expired',
  },
  ACTIVITY_LOG: 'activity_log',
  SYNC: {
    USER: 'sync.user',
    ORDER: 'sync.order',
    LOG: 'sync.log',
    CAMPAIGN: 'sync.campaign',
  },
  DEVICE: {
    GENERATE_QR: 'device.generate_qr',
  },
  USER: {
    VERIFIED: 'user.verified',
    WASHED: 'user.washed',
  },
  PACKAGE: {
    PROCESS: 'package.process',
  },
  SUPPORT: {
    NOTIFICATION: 'support.notification',
  },
};
