import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Queue } from 'bull';
import { DataSource, IsNull } from 'typeorm';

import { EVENT, QUEUE } from '../../../constants';
import { OrderEntity } from '../../order/entities/order.entity';
import { OrderStatusEnum } from '../../order/enums/order-status.enum';
import { OrderTypeEnum } from '../../order/enums/order-type.enum';
import { UserEntity } from '../entities/user.entity';

@Injectable()
export class UserListener {
  constructor(
    @InjectQueue(QUEUE.USER.REDEEM_VOUCHER)
    private readonly _queue: Queue<string>,
    private readonly _dataSource: DataSource,
  ) {}

  @OnEvent(EVENT.USER.VERIFIED)
  async handleUserVerifiedEvent(id: string) {
    await this._queue.add(QUEUE.USER.REDEEM_VOUCHER, id, {
      jobId: id,
    });
  }

  @OnEvent(EVENT.USER.WASHED)
  async handleUserWashedEvent(id: string) {
    if (!id) return;

    const user = await this._dataSource.getRepository(UserEntity).findOneBy({
      id,
      stationId: IsNull(),
    });
    if (!user) return;

    const order = await this._dataSource.getRepository(OrderEntity).findOne({
      where: {
        customerId: id,
        status: OrderStatusEnum.COMPLETED,
        type: OrderTypeEnum.DEFAULT,
      },
      order: {
        createdAt: 'ASC',
      },
    });
    if (!order) return;

    await this._dataSource.getRepository(UserEntity).update(id, {
      stationId: order.data?.stationId,
    });
  }
}
