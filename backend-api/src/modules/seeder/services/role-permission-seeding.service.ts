import { Injectable } from '@nestjs/common';
import { DataSource, In, Not, Repository } from 'typeorm';
import { Transactional } from 'typeorm-transactional';

import { generateHash } from '../../../common/utils';
import { ApiConfigService } from '../../../shared/services/api-config.service';
import { LoggerService } from '../../../shared/services/logger.service';
import { AuthProvider } from '../../auth/enums/auth-provider.enum';
import { ROLE_PERMISSIONS } from '../../role-permission/constants/role-permission.constants';
import { RoleEntity } from '../../role-permission/entities/role.entity';
import { RolePermissionEntity } from '../../role-permission/entities/role-permission.entity';
import { PermissionActions } from '../../role-permission/enums/permissions.enum';
import { Role } from '../../role-permission/enums/roles.enum';
import { UserEntity } from '../../user/entities/user.entity';
import { UserRoleEntity } from '../../user/entities/user-role.entity';
import { UserStatus } from '../../user/enums/user-status.enum';
import { UserType } from '../../user/enums/user-type.enum';

@Injectable()
export class RolePermissionSeedingService {
  private readonly _roleRepository: Repository<RoleEntity>;
  private readonly _rolePermissionRepository: Repository<RolePermissionEntity>;

  constructor(
    private _dataSource: DataSource,
    private readonly _logger: LoggerService,
    private readonly _appConfig: ApiConfigService,
  ) {
    this._roleRepository = this._dataSource.getRepository(RoleEntity);
    this._rolePermissionRepository =
      this._dataSource.getRepository(RolePermissionEntity);
  }

  @Transactional()
  public async runs() {
    await this.seedRoles();
    await this.seedRolePermissions();
    // await this.seedUser(UserType.SA);
    // await this.seedUser(UserType.ADMIN);
  }

  public async seedRoles() {
    try {
      const roleEntities = Object.keys(Role).map((key: keyof typeof Role) => {
        return this._roleRepository.create({
          id: Role[key],
          name: key,
          code: key,
          isSystemRole: true,
        });
      });

      await this._roleRepository.save(roleEntities);
      await this._roleRepository.delete({
        isSystemRole: true,
        id: Not(In(Object.values(Role) || [])),
      });

      return roleEntities;
    } catch (error) {
      this._logger.error(error);
      return null;
    }
  }

  public async seedRolePermissions() {
    try {
      const keys = Object.keys(ROLE_PERMISSIONS);
      const defaultActions = Object.values(PermissionActions);

      const shouldSeedRolePermissions: Array<Partial<RolePermissionEntity>> =
        [];

      for (const key of keys) {
        const permissions = ROLE_PERMISSIONS[key];
        if (!permissions || permissions.length === 0) {
          await this._rolePermissionRepository.delete({ roleId: key });
          continue;
        }

        for (const permission of permissions) {
          const actions = permission?.actions || [];

          if (actions?.length === 0) {
            // full group permissions
            shouldSeedRolePermissions.push(
              ...defaultActions.map((_action) => {
                return {
                  roleId: key,
                  code: _action,
                  groupCode: permission.group,
                };
              }),
            );
          } else {
            // custom group permissions
            shouldSeedRolePermissions.push(
              ...actions.map((_action) => {
                return {
                  roleId: key,
                  code: _action,
                  groupCode: permission.group,
                };
              }),
            );
          }
        }

        const existRolePermissions =
          await this._rolePermissionRepository.findBy({
            roleId: key,
          });
        const existRolePermissionsKeyBy: {
          [id: string]: RolePermissionEntity;
        } = {};

        existRolePermissions.forEach((entity) => {
          existRolePermissionsKeyBy[entity.groupCode + '_' + entity.code] =
            entity;
        });

        const seedRolePermissions = shouldSeedRolePermissions.filter((item) => {
          if (existRolePermissionsKeyBy[item.groupCode + '_' + item.code]) {
            return false;
          }
          return true;
        });

        if (seedRolePermissions?.length > 0) {
          await this._rolePermissionRepository.save(seedRolePermissions);
        }

        // Remove old role permissions
        const groupCodeCombines = shouldSeedRolePermissions.map(
          (item) => item.groupCode + '_' + item.code,
        );

        await this._rolePermissionRepository
          .createQueryBuilder('RolePermissions')
          .where(
            `(group_code || '_' || code) Not In (:...groupCodeCombines) AND role_id = :roleId`,
            {
              roleId: key,
              groupCodeCombines,
            },
          )
          .delete()
          .execute();
      }
    } catch (error) {
      this._logger.error(error);
    }
  }

  private async seedUser(type: UserType.ADMIN | UserType.SA): Promise<boolean> {
    const isAdmin = type === UserType.ADMIN;
    const role = isAdmin ? Role.ADMIN : Role.SA;

    const data = isAdmin ? this._appConfig.admin : this._appConfig.sysadmin;
    if (!data) return false;

    const { username, password } = data;
    if (!username || !password) return false;

    return this._dataSource.transaction(async (manager) => {
      const user = await manager
        .getRepository(UserEntity)
        .findOneBy({ email: username });

      const entity: Partial<UserEntity> = {
        firstName: isAdmin ? 'ADMIN' : 'SYSADMIN',
        lastName: '',
        email: username,
        password: generateHash(password),
        provider: AuthProvider.email,
        status: UserStatus.ACTIVE,
        type: type,
      };

      const userRepository = manager.getRepository(UserEntity);
      const userRoleRepository = manager.getRepository(UserRoleEntity);

      if (user) {
        // Update existing user
        await userRepository.update(user.id, entity);
        await userRoleRepository.delete({ userId: user.id });

        const newUserRole: Partial<UserRoleEntity> = {
          userId: user.id,
          roleId: role,
        };
        await userRoleRepository.save(newUserRole);
      } else {
        // Create new user
        const result = await userRepository.save(entity);
        const newUserRole: Partial<UserRoleEntity> = {
          userId: result.id,
          roleId: role,
        };
        await userRoleRepository.save(newUserRole);
      }

      return true;
    });
  }
}
