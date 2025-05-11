import type { PipeTransform } from '@nestjs/common';
import {
  applyDecorators,
  Param,
  ParseUUIDPipe,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import type { Type } from '@nestjs/common/interfaces';
import { ApiBearerAuth, ApiUnauthorizedResponse } from '@nestjs/swagger';

import { AuthGuard } from '../guards/auth.guard';
import { RolesOrPermissionsGuard } from '../guards/role-or-permission.guard';
import { AuthUserInterceptor } from '../interceptors/auth-user-interceptor.service';
import { Role } from '../modules/role-permission/enums/roles.enum';
import { Permissions } from './permissions.decorator';
import { PublicRoute } from './public-route.decorator';
import { Roles } from './roles.decorator';

type TypeAuth = Partial<{
  roles: Role[];
  permissions: string[];
  options: Partial<{ public: boolean }>;
}>;

export function Auth({
  roles = [],
  permissions = [],
  options,
}: TypeAuth = {}): MethodDecorator & ClassDecorator {
  const isPublicRoute = options?.public;

  return applyDecorators(
    Roles(...roles),
    Permissions(...permissions),
    UseGuards(AuthGuard({ public: isPublicRoute }), RolesOrPermissionsGuard),
    ApiBearerAuth(),
    UseInterceptors(AuthUserInterceptor),
    ApiUnauthorizedResponse({ description: 'Unauthorized' }),
    PublicRoute(isPublicRoute),
  );
}

export function UUIDParam(
  property: string,
  ...pipes: Array<Type<PipeTransform> | PipeTransform>
): ParameterDecorator {
  return Param(property, new ParseUUIDPipe({ version: '4' }), ...pipes);
}
