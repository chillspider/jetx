import {
  createMap,
  forMember,
  mapFrom,
  Mapper,
  MappingProfile,
} from '@automapper/core';
import { AutomapperProfile, InjectMapper } from '@automapper/nestjs';
import { Injectable } from '@nestjs/common';

import { GeneratorProvider } from '../../../providers';
import { OrderEntity } from '../../order/entities/order.entity';
import { OrderItemEntity } from '../../order/entities/order-item.entity';
import { OrderUtils } from '../../order/utils/order.utils';
import { OrderTransactionEntity } from '../../payment/entities/order-transaction.entity';
import { SupportEntity } from '../../support/entities/support.entity';
import { UserEntity } from '../../user/entities/user.entity';
import { SyncOrderDto } from '../dtos/sync-order.dto';
import { SyncOrderItemDto } from '../dtos/sync-order-item.dto';
import { SyncOrderTransactionDto } from '../dtos/sync-order-transaction.dto';
import { SyncSupportDto } from '../dtos/sync-support.dto';
import { SyncUserDto } from '../dtos/sync-user.dto';

@Injectable()
export class SyncProfile extends AutomapperProfile {
  constructor(@InjectMapper() mapper: Mapper) {
    super(mapper);
  }

  get profile(): MappingProfile {
    return (mapper) => {
      createMap(
        mapper,
        UserEntity,
        SyncUserDto,
        forMember(
          (d) => d.avatar,
          mapFrom((s) => GeneratorProvider.getS3PublicUrl(s.avatar)),
        ),
      );
      createMap(
        mapper,
        OrderEntity,
        SyncOrderDto,
        forMember(
          (d) => d.data,
          mapFrom((s) => s.data || {}),
        ),
        forMember(
          (d) => d.stationId,
          mapFrom((s) => s.data?.stationId),
        ),
        forMember(
          (d) => d.createdTime,
          mapFrom((s) => s.createdAt),
        ),
        forMember(
          (d) => d.voucherName,
          mapFrom((s) => OrderUtils.getVoucherName(s.discounts)),
        ),
      );
      createMap(
        mapper,
        OrderItemEntity,
        SyncOrderItemDto,
        forMember(
          (d) => d.data,
          mapFrom((s) => s.data || {}),
        ),
      );
      createMap(
        mapper,
        OrderTransactionEntity,
        SyncOrderTransactionDto,
        forMember(
          (d) => d.data,
          mapFrom((s) => s.data || {}),
        ),
      );
      createMap(
        mapper,
        SupportEntity,
        SyncSupportDto,
        forMember(
          (d) => d.userId,
          mapFrom((s) => s.customerId),
        ),
        forMember(
          (d) => d.email,
          mapFrom((s) => s.customerEmail),
        ),
        forMember(
          (d) => d.phone,
          mapFrom((s) => s.customerPhone),
        ),
        forMember(
          (d) => d.name,
          mapFrom((s) => s.customerName),
        ),
        forMember(
          (d) => d.requestDetail,
          mapFrom((s) => s.content),
        ),
        forMember(
          (d) => d.images,
          mapFrom((s) =>
            (s.images || [])?.map((url) => ({
              url: GeneratorProvider.getS3PublicUrl(url),
            })),
          ),
        ),
      );
    };
  }
}
