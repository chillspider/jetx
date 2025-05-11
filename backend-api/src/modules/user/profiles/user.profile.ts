import {
  createMap,
  forMember,
  mapFrom,
  Mapper,
  MappingProfile,
} from '@automapper/core';
import { AutomapperProfile, InjectMapper } from '@automapper/nestjs';
import { Injectable } from '@nestjs/common';

import { formattedName } from '../../../common/utils';
import { canSubmitReferral } from '../../../common/utils/user-utils';
import { UserPayloadDto } from '../../auth/dto/response/user-payload.dto';
import { ReferralAndNameDto, ReferralDto } from '../dtos/referral.dto';
import { UpdateProfileDto } from '../dtos/requests/update-profile.dto';
import { UserDto } from '../dtos/user.dto';
import { UserRoleDto } from '../dtos/user-role.dto';
import { UserTokenDto } from '../dtos/user-token.dto';
import { ReferralEntity } from '../entities/referral.entity';
import { UserEntity } from '../entities/user.entity';
import { UserRoleEntity } from '../entities/user-role.entity';
import { UserTokenEntity } from '../entities/user-token.entity';

@Injectable()
export class UserProfile extends AutomapperProfile {
  constructor(@InjectMapper() mapper: Mapper) {
    super(mapper);
  }

  get profile(): MappingProfile {
    return (mapper) => {
      createMap(
        mapper,
        UserEntity,
        UserDto,
        forMember(
          (destination) => destination.fullName,
          mapFrom((source) => {
            return formattedName(source.firstName, source.lastName);
          }),
        ),
        forMember(
          (d) => d.isReferred,
          mapFrom((s) => !canSubmitReferral(s)),
        ),
      );
      createMap(mapper, UserDto, UserEntity);
      createMap(
        mapper,
        UserEntity,
        UserPayloadDto,
        forMember(
          (d) => d.roles,
          mapFrom((s) => (s.userRoles || [])?.map((ur) => ur.roleId)),
        ),
        forMember(
          (destination) => destination.fullName,
          mapFrom((source) => {
            return formattedName(source.firstName, source.lastName);
          }),
        ),
        forMember(
          (d) => d.isReferred,
          mapFrom((s) => !canSubmitReferral(s)),
        ),
      );
      createMap(mapper, UserRoleEntity, UserRoleDto);
      createMap(mapper, UpdateProfileDto, UserEntity);
      createMap(mapper, UserTokenEntity, UserTokenDto);
      createMap(mapper, ReferralEntity, ReferralDto);
      createMap(
        mapper,
        ReferralEntity,
        ReferralAndNameDto,
        forMember(
          (d) => d.referralEmail,
          mapFrom((s) => s.referralUser?.email),
        ),
        forMember(
          (d) => d.referralName,
          mapFrom((s) =>
            formattedName(s.referralUser?.firstName, s.referralUser?.lastName),
          ),
        ),
        forMember(
          (d) => d.referredEmail,
          mapFrom((s) => s.referredUser?.email),
        ),
        forMember(
          (d) => d.referredName,
          mapFrom((s) =>
            formattedName(s.referredUser?.firstName, s.referredUser?.lastName),
          ),
        ),
      );
    };
  }
}
