import { Injectable, Logger } from '@nestjs/common';
import { Timeout } from '@nestjs/schedule';

import { ApiConfigService } from '../../../shared/services/api-config.service';
import { AttentionSeedingService } from '../../seeder/services/attention-seeding.service';
import { LocationSeedingService } from '../../seeder/services/location-seeding.service';
import { RolePermissionSeedingService } from '../../seeder/services/role-permission-seeding.service';

@Injectable()
export class StartupService {
  private readonly logger = new Logger(StartupService.name);

  constructor(
    private _appConfig: ApiConfigService,
    private _rolePermissionSeedingService: RolePermissionSeedingService,
    private _locationSeedingService: LocationSeedingService,
    private _attentionSeedingService: AttentionSeedingService,
  ) {}

  @Timeout(1000)
  async handleStartupTasks(): Promise<void> {
    this.logger.log('Startup Tasks');
    if (this._appConfig.enableSeeding) {
      try {
        this._rolePermissionSeedingService.runs();
        // this._locationSeedingService.runs();
        // this._attentionSeedingService.runs();
      } catch (err) {
        this.logger.error(err);
      }
    }
  }
}
