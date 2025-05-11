import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Cron, CronExpression, SchedulerRegistry } from '@nestjs/schedule';

import { EVENT } from '../../../constants';
import { DEFAULT_TIMEZONE } from '../../../constants/config';
import { ApiConfigService } from '../../../shared/services/api-config.service';
import { LoggerService } from '../../../shared/services/logger.service';

const CheckOrderJobName = 'cron:check-order-status';

@Injectable()
export class TaskService {
  constructor(
    private readonly _emitter: EventEmitter2,
    private readonly _logger: LoggerService,
    private readonly _config: ApiConfigService,
    private readonly _scheduler: SchedulerRegistry,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, {
    timeZone: DEFAULT_TIMEZONE,
  })
  async handleExpiredMemberships() {
    this._logger.info('[CRON]: Start update membership expiration');
    await this._emitter.emitAsync(EVENT.MEMBERSHIP.UPDATE_EXPIRED);
    this._logger.info('[CRON]: End update membership expiration');
  }

  // TODO: Remove when ygl webhook stable
  @Cron(CronExpression.EVERY_MINUTE, {
    name: CheckOrderJobName,
  })
  async handleCheckOrderStatus() {
    //! If in production, disable the cron job
    if (this._config.isProduction) {
      try {
        const job = this._scheduler.getCronJob(CheckOrderJobName);
        job?.stop();
      } catch (error) {
        this._logger.error(error);
      }

      return;
    }

    this._logger.info('[CRON]: Check order status');
    await this._emitter.emitAsync(EVENT.ORDER.CHECK_STATUS);
  }
}
