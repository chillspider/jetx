import {
  createMap,
  forMember,
  mapFrom,
  Mapper,
  MappingProfile,
} from '@automapper/core';
import { AutomapperProfile, InjectMapper } from '@automapper/nestjs';
import { Injectable } from '@nestjs/common';

import { B2bVoucherCodeEntity } from '../../b2b-voucher/entities/b2b-voucher-code.entity';
import { VoucherEntity } from '../../voucher/entities/voucher.entity';
import { SyncVoucherDto } from '../dtos/sync-voucher.dto';
import { SyncB2BVoucherCodeDto } from '../dtos/sync-voucher-code.dto';

@Injectable()
export class SyncProfile extends AutomapperProfile {
  constructor(@InjectMapper() mapper: Mapper) {
    super(mapper);
  }

  get profile(): MappingProfile {
    return (mapper) => {
      createMap(
        mapper,
        VoucherEntity,
        SyncVoucherDto,
        forMember(
          (d) => d.excludeTime,
          mapFrom((s) => s.validity?.excludeTimes),
        ),
        forMember(
          (d) => d.voucherId,
          mapFrom((s) => s.id),
        ),
        forMember(
          (d) => d.packageId,
          mapFrom((s) => s.data?.packageId),
        ),
        forMember(
          (d) => d.orderPackageId,
          mapFrom((s) => s.data?.orderPackageId),
        ),
        forMember(
          (d) => d.stationId,
          mapFrom((s) => s.data?.stationId),
        ),
        forMember(
          (d) => d.stationName,
          mapFrom((s) => s.data?.stationName),
        ),
        forMember(
          (d) => d.transactionId,
          mapFrom((s) => s.data?.orderIncrementId),
        ),
        forMember(
          (d) => d.transactionTimestamp,
          mapFrom((s) => s.data?.orderCreatedAt),
        ),
      );
      createMap(
        mapper,
        B2bVoucherCodeEntity,
        SyncB2BVoucherCodeDto,
        forMember(
          (d) => d.b2BVoucherId,
          mapFrom((s) => s.b2bVoucherId),
        ),
        forMember(
          (d) => d.name,
          mapFrom((s) => s.code),
        ),
      );
    };
  }
}
