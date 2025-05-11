import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SharedModule } from '../../shared/shared.module';
import { RoleEntity } from './entities/role.entity';
import { RolePermissionEntity } from './entities/role-permission.entity';
import { RolePermissionProfile } from './profiles/role-permission.profile';
import { RolePermissionService } from './services/role-permission.service';

const providers = [RolePermissionProfile, RolePermissionService];

@Module({
  imports: [
    SharedModule,
    TypeOrmModule.forFeature([RoleEntity, RolePermissionEntity]),
  ],
  providers: [...providers],
  controllers: [],
  exports: [...providers],
})
export class RolePermissionModule {}
