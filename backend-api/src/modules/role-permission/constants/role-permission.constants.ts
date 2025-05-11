import { Permissions } from '../enums/permissions.enum';
import { Role } from '../enums/roles.enum';

type TypeRolePermission = {
  group: string;
  actions: string[];
};

export const ROLE_PERMISSIONS: Record<string, TypeRolePermission[]> = {
  [Role.SA]: Object.values(Permissions).map((permission) => {
    return {
      group: permission,
      // Empty actions mean full group permissions
      actions: [] as string[],
    };
  }),
  [Role.ADMIN]: [],
  [Role.USER]: [],
  [Role.ASSISTANT]: [],
};
