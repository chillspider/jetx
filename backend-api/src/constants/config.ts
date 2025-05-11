import * as path from 'path';

export const EMAIL_TEMPLATE_PATH = path.join(
  __dirname,
  '..',
  'templates/mails',
);

export const LIMIT_IMAGE_SIZE = 10 * 1024 * 1024;

export const IMG_PATH = {
  ROOT: 'library',
  ATTENTION_DEFAULT: 'attentions/defaults',
  ATTENTION_CUSTOM: 'attentions/customs',
  PRODUCT: 'products',
  PRODUCT_THUMBNAIL: 'products/thumbnails',
  STATION: 'stations',
  STATION_THUMBNAIL: 'stations/thumbnails',
  USER: 'users',
  USER_AVATAR: 'users/avatars',
  USER_VEHICLE: 'users/vehicles',
  IMAGES: 'images',
  SUPPORT: 'supports',
  CAR: 'cars',
};

export const DEFAULT_TIMEZONE = 'Asia/Ho_Chi_Minh';

export const TRACE_ID_HEADER = 'X-Trace-Id';

export const YGL_TEST_DEVICE = 'YGLTEST06SC01';

/// Expired time for submit referral code
export const REFERRAL_SUBMIT_EXPIRE = 7; // days

export const VOUCHER_CREATE_ATTEMPT_LIMIT = 5;
export const VOUCHER_USAGE_DURATION = 60; // days
