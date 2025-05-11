export class CRON {
  static PREFIX = 'manual-cron';

  static CAMPAIGN = (campaignId: string) =>
    `${CRON.PREFIX}:campaign:${campaignId}`;

  static QR_PENDING = (transactionId: string) => `qr-pending:${transactionId}`;

  static DETECTOR_PENDING = (orderId: string) => `detector-pending:${orderId}`;
}
