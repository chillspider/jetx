import {
  createMap,
  forMember,
  mapFrom,
  Mapper,
  MappingProfile,
} from '@automapper/core';
import { AutomapperProfile, InjectMapper } from '@automapper/nestjs';
import { Injectable } from '@nestjs/common';

import { maskEmail, maskString } from '../../../common/utils';
import { BBOrderDto, BBOrderItemDto } from '../../bitebolt/dtos/bb-order.dto';
import { OrderDetectorDto } from '../../car-detector/dtos/order-detector.dto';
import { OrderDto } from '../dtos/order.dto';
import { OrderItemDto } from '../dtos/order-item.dto';
import { OrderNotificationDto } from '../dtos/order-notification.dto';
import { OrderVoucherDto } from '../dtos/order-voucher.dto';
import { VoucherDto } from '../dtos/voucher.dto';
import { OrderEntity } from '../entities/order.entity';
import { OrderItemEntity } from '../entities/order-item.entity';

@Injectable()
export class OrderProfile extends AutomapperProfile {
  constructor(@InjectMapper() mapper: Mapper) {
    super(mapper);
  }

  get profile(): MappingProfile {
    return (mapper) => {
      createMap(mapper, OrderEntity, OrderDto);
      createMap(mapper, OrderDto, OrderEntity);
      createMap(
        mapper,
        OrderItemEntity,
        OrderItemDto,
        forMember(
          (d) => d.photo,
          mapFrom((s) => s.data?.photo),
        ),
      );
      createMap(mapper, OrderItemDto, OrderItemEntity);
      createMap(mapper, VoucherDto, OrderVoucherDto);
      createMap(mapper, BBOrderDto, OrderEntity);
      createMap(mapper, BBOrderItemDto, OrderItemEntity);
      createMap(
        mapper,
        OrderEntity,
        OrderNotificationDto,
        forMember(
          (d) => d.packageName,
          mapFrom((s) => s.data?.packageName),
        ),
      );
      createMap(
        mapper,
        OrderEntity,
        OrderDetectorDto,
        forMember(
          (d) => d.customerEmail,
          mapFrom((s) => maskEmail(s.customerEmail)),
        ),
        forMember(
          (d) => d.customerPhone,
          mapFrom((s) => maskString(s.customerPhone)),
        ),
      );
    };
  }
}
