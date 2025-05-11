import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { ROLE_KEY } from '../decorators';
import { PERMISSION_KEY } from '../decorators/permissions.decorator';
import { UserPayloadDto } from '../modules/auth/dto/response/user-payload.dto';
import { Role } from '../modules/role-permission/enums/roles.enum';

@Injectable()
export class RolesOrPermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const { user }: { user: Partial<UserPayloadDto> } = context
      .switchToHttp()
      .getRequest();
    const { roles, rights } = user;

    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles?.length && !requiredPermissions?.length) {
      return true;
    }

    // check roles
    if (requiredRoles && requiredRoles.some((role) => roles?.includes(role))) {
      return true;
    }

    // check permissions
    if (
      requiredPermissions &&
      requiredPermissions.some((permission) => rights?.includes(permission))
    ) {
      return true;
    }

    return false;
  }
}
