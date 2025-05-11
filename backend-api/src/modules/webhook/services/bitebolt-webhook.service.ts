import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { EVENT } from '../../../constants';
import { SyncActionEnum } from '../../../constants/action';
import { LoggerService } from '../../../shared/services/logger.service';
import {
  BiteboltWebhookEntity,
  BiteboltWebhookEventDto,
} from '../../bitebolt/dtos/bitebolt-webhook-event.dto';
import { OrderStatusEnum } from '../../order/enums/order-status.enum';
import { FnbOrderService } from '../../order/services/fnb-order.service';

@Injectable()
export class BiteboltWebhookService {
  constructor(
    private readonly _logger: LoggerService,
    private readonly _fnbOrder: FnbOrderService,
    private readonly _emitter: EventEmitter2,
  ) {}

  public async handleBiteboltWebhookEvent(
    body: BiteboltWebhookEventDto,
  ): Promise<boolean> {
    if (!body) {
      return false;
    }

    this._logger.log(
      `[BITEBOLT WEBHOOK] ${body.entity} ${body.type} ${body.occurredAt} data: ${JSON.stringify(body.data)}`,
    );

    switch (body.entity) {
      case BiteboltWebhookEntity.ORDER:
        await this.handleOrder(body);
        break;
    }

    return true;
  }

  private async handleOrder(body: BiteboltWebhookEventDto) {
    const result = await this._fnbOrder.syncBBOrder({
      bbOrderId: body?.data?.id,
      sendNotification: true,
    });

    // ! Sync Nflow
    if (result) {
      this._emitter.emit(EVENT.SYNC.ORDER, {
        action: SyncActionEnum.Sync,
        id: result.id,
      });
    }

    if (result.status === OrderStatusEnum.REFUNDED) {
      this._emitter.emit(EVENT.ORDER.REFUND, result.id);
    }
  }
}
