import { Mapper } from '@automapper/core';
import { InjectMapper } from '@automapper/nestjs';
import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { DataSource } from 'typeorm';

import { EVENT } from '../../../constants';
import { LoggerService } from '../../../shared/services/logger.service';
import { TransactionLogDto } from '../dtos/transaction-log.dto';
import { OrderTransactionEntity } from '../entities/order-transaction.entity';
import { OrderTransactionLogEntity } from '../entities/order-transaction-log.entity';

@Injectable()
export class OrderTransactionLogListener {
  constructor(
    @InjectMapper() private readonly _mapper: Mapper,
    private readonly _dataSource: DataSource,
    private readonly _logger: LoggerService,
  ) {}

  @OnEvent(EVENT.ORDER_TRANSACTION.LOG, { async: true })
  async createTransactionLog(dto: TransactionLogDto): Promise<void> {
    if (!dto) {
      return;
    }

    try {
      const entity = this._mapper.map(
        dto,
        TransactionLogDto,
        OrderTransactionLogEntity,
      );

      const ot = this._dataSource.getRepository(OrderTransactionEntity);

      // Sync transactionId with orderTransactionId
      if (entity.orderTransactionId && !entity.transactionId) {
        const orderTransaction = await ot.findOneBy({
          id: entity.orderTransactionId,
        });

        entity.transactionId = orderTransaction?.transactionId;
      } else if (!entity.orderTransactionId && entity.transactionId) {
        const orderTransaction = await ot.findOneBy({
          transactionId: entity.transactionId,
        });

        entity.orderTransactionId = orderTransaction?.id;
      }

      await this._dataSource
        .getRepository(OrderTransactionLogEntity)
        .save(entity);
    } catch (error) {
      this._logger.error(error);
      return;
    }
  }
}
