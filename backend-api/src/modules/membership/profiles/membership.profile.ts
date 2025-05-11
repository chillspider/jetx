import { createMap, Mapper, MappingProfile } from '@automapper/core';
import { AutomapperProfile, InjectMapper } from '@automapper/nestjs';
import { Injectable } from '@nestjs/common';

import { MembershipDto } from '../dtos/membership.dto';
import { OrderMembershipDto } from '../dtos/order-membership.dto';
import {
  CreateMembershipDto,
  UpdateMembershipDto,
} from '../dtos/requests/create-membership.dto';
import { UserMembershipDto } from '../dtos/user-membership.dto';
import { MembershipEntity } from '../entities/membership.entity';
import { UserMembershipEntity } from '../entities/user-membership.entity';

@Injectable()
export class MembershipProfile extends AutomapperProfile {
  constructor(@InjectMapper() mapper: Mapper) {
    super(mapper);
  }

  get profile(): MappingProfile {
    return (mapper) => {
      createMap(mapper, MembershipEntity, MembershipDto);
      createMap(mapper, MembershipDto, MembershipEntity);
      createMap(mapper, CreateMembershipDto, MembershipEntity);
      createMap(mapper, UpdateMembershipDto, MembershipEntity);
      createMap(mapper, UserMembershipEntity, UserMembershipDto);
      createMap(mapper, UserMembershipDto, UserMembershipEntity);
      createMap(mapper, UserMembershipEntity, OrderMembershipDto);
      createMap(mapper, UserMembershipDto, OrderMembershipDto);
    };
  }
}
