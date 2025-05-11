import {
  createMap,
  forMember,
  mapFrom,
  Mapper,
  MappingProfile,
} from '@automapper/core';
import { AutomapperProfile, InjectMapper } from '@automapper/nestjs';
import { Injectable } from '@nestjs/common';

import { toUtc } from '../../common/utils';
import { SyncVoucherDto } from '../sync/dtos/sync-voucher.dto';
import { CreateVoucherDto } from './dtos/requests/create-voucher.dto';
import { UpdateVoucherDto } from './dtos/requests/update-voucher.dto';
import { VoucherDto } from './dtos/voucher.dto';
import { VoucherEntity } from './entities/voucher.entity';

@Injectable()
export class VoucherProfile extends AutomapperProfile {
  constructor(@InjectMapper() mapper: Mapper) {
    super(mapper);
  }

  get profile(): MappingProfile {
    return (mapper) => {
      createMap(mapper, VoucherEntity, VoucherDto);
      createMap(mapper, VoucherDto, VoucherEntity);
      createMap(
        mapper,
        CreateVoucherDto,
        VoucherEntity,
        forMember(
          (d) => d.validity,
          mapFrom((s) => ({
            excludeTimes: (s.excludeTime || []).map((e) => ({
              ...e,
              start: toUtc(e.start),
              end: toUtc(e.end),
            })),
            washModes: s.washModes || [],
          })),
        ),
        forMember(
          (d) => d.startAt,
          mapFrom((s) => toUtc(s.startAt)),
        ),
        forMember(
          (d) => d.endAt,
          mapFrom((s) => toUtc(s.endAt)),
        ),
      );
      createMap(mapper, UpdateVoucherDto, VoucherEntity);
      createMap(
        mapper,
        CreateVoucherDto,
        SyncVoucherDto,
        forMember(
          (d) => d.excludeTime,
          mapFrom((s) =>
            (s.excludeTime || []).map((e) => ({
              ...e,
              start: toUtc(e.start),
              end: toUtc(e.end),
            })),
          ),
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
    };
  }
}
