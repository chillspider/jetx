import { createMap, Mapper, MappingProfile } from '@automapper/core';
import { AutomapperProfile, InjectMapper } from '@automapper/nestjs';
import { Injectable } from '@nestjs/common';

import { RoleDto } from '../dtos/role.dto';
import { RolePermissionDto } from '../dtos/role-permission.dto';
import { RoleEntity } from '../entities/role.entity';
import { RolePermissionEntity } from '../entities/role-permission.entity';

@Injectable()
export class RolePermissionProfile extends AutomapperProfile {
  constructor(@InjectMapper() mapper: Mapper) {
    super(mapper);
  }

  override get profile(): MappingProfile {
    return (mapper) => {
      createMap(mapper, RoleEntity, RoleDto);
      createMap(mapper, RolePermissionEntity, RolePermissionDto);
    };
  }
}
