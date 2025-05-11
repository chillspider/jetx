import { Mapper } from '@automapper/core';
import { InjectMapper } from '@automapper/nestjs';
import { Injectable } from '@nestjs/common';
import { DataSource, In, Repository } from 'typeorm';

import { RolePermissionDto } from '../dtos/role-permission.dto';
import { RolePermissionEntity } from '../entities/role-permission.entity';

@Injectable()
export class RolePermissionService {
  private readonly _rolePermissionsRepository: Repository<RolePermissionEntity>;

  constructor(
    private _dataSource: DataSource,
    @InjectMapper() private readonly _mapper: Mapper,
  ) {
    this._rolePermissionsRepository =
      this._dataSource.getRepository(RolePermissionEntity);
  }

  public async getPermissions(roles: string[]): Promise<RolePermissionDto[]> {
    const rolePermissions = await this._rolePermissionsRepository.findBy({
      roleId: In(roles),
    });
    if (!rolePermissions) return [];

    return this._mapper.mapArray(
      rolePermissions,
      RolePermissionEntity,
      RolePermissionDto,
    );
  }
}
