import {
  createMap,
  forMember,
  mapFrom,
  Mapper,
  MappingProfile,
} from '@automapper/core';
import { AutomapperProfile, InjectMapper } from '@automapper/nestjs';
import { Injectable } from '@nestjs/common';

import { OrderTransactionDto } from '../dtos/order-transaction.dto';
import { TransactionLogDto } from '../dtos/transaction-log.dto';
import { OrderTransactionEntity } from '../entities/order-transaction.entity';
import { OrderTransactionLogEntity } from '../entities/order-transaction-log.entity';

@Injectable()
export class OrderTransactionProfile extends AutomapperProfile {
  constructor(@InjectMapper() mapper: Mapper) {
    super(mapper);
  }

  get profile(): MappingProfile {
    return (mapper) => {
      createMap(mapper, OrderTransactionEntity, OrderTransactionDto);
      createMap(mapper, OrderTransactionDto, OrderTransactionEntity);
      createMap(
        mapper,
        OrderTransactionLogEntity,
        TransactionLogDto,
        forMember(
          (d) => d.data,
          mapFrom((s) => s.data),
        ),
        forMember(
          (d) => d.header,
          mapFrom((s) => s.header),
        ),
        forMember(
          (d) => d.params,
          mapFrom((s) => s.params),
        ),
      );
      createMap(
        mapper,
        TransactionLogDto,
        OrderTransactionLogEntity,
        forMember(
          (d) => d.data,
          mapFrom((s) => s.data),
        ),
        forMember(
          (d) => d.header,
          mapFrom((s) => s.header),
        ),
        forMember(
          (d) => d.params,
          mapFrom((s) => s.params),
        ),
      );
    };
  }
}
