import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ApiConfigService } from '../../shared/services/api-config.service';
import { SharedModule } from '../../shared/shared.module';
import { AttentionSeedingService } from './services/attention-seeding.service';
import { LocationSeedingService } from './services/location-seeding.service';
import { RolePermissionSeedingService } from './services/role-permission-seeding.service';

const services = [
  RolePermissionSeedingService,
  LocationSeedingService,
  AttentionSeedingService,
];

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [SharedModule],
      useFactory: (configService: ApiConfigService) =>
        configService.postgresConfig,
      inject: [ApiConfigService],
    }),
    SharedModule,
  ],
  controllers: [],
  providers: [...services],
  exports: [...services],
})
export class SeederModule {}
