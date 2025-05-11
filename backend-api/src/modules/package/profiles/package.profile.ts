import {
  createMap,
  forMember,
  mapFrom,
  Mapper,
  MappingProfile,
} from '@automapper/core';
import { AutomapperProfile, InjectMapper } from '@automapper/nestjs';
import { Injectable } from '@nestjs/common';

import { NflowPackageDto } from '../dtos/nflow-package.dto';
import { PackageDto } from '../dtos/package.dto';

@Injectable()
export class PackageProfile extends AutomapperProfile {
  constructor(@InjectMapper() mapper: Mapper) {
    super(mapper);
  }

  get profile(): MappingProfile {
    return (mapper) => {
      createMap(
        mapper,
        NflowPackageDto,
        PackageDto,
        forMember(
          (d) => d.price,
          mapFrom((s) => Number(s.pricing || 0)),
        ),
        forMember(
          (d) => d.targets,
          mapFrom((s) => s.userEligibles || []),
        ),
        forMember(
          (d) => d.vouchers,
          mapFrom((s) => s.vouchers || []),
        ),
        forMember(
          (d) => d.stationIds,
          mapFrom((s) => s.stations || []),
        ),
        forMember(
          (d) => d.details,
          mapFrom((s) => s.description),
        ),
        forMember(
          (d) => d.status,
          mapFrom((s) => s.$metadata?.origin?.status),
        ),
      );
    };
  }
}
