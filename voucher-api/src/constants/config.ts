import * as path from 'path';

export const EMAIL_TEMPLATE_PATH = path.join(
  __dirname,
  '..',
  'templates/mails',
);

export const LIMIT_IMAGE_SIZE = 10 * 1024 * 1024;

export const DEFAULT_TIMEZONE = 'Asia/Ho_Chi_Minh';

export const TRACE_ID_HEADER = 'X-Trace-Id';
