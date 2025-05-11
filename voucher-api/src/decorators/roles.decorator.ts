/* eslint-disable @typescript-eslint/naming-convention */
import { SetMetadata } from '@nestjs/common';

import { Role } from '../modules/role-permission/enums/roles.enum';

export const ROLE_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLE_KEY, roles);
