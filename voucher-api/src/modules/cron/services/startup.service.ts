import { Injectable, Logger } from '@nestjs/common';
import { Timeout } from '@nestjs/schedule';

import { ApiConfigService } from '../../../shared/services/api-config.service';
import { SeederService } from '../../seeder/services/seeder.service';

@Injectable()
export class StartupService {
  private readonly logger = new Logger(StartupService.name);

  constructor(
    private appConfig: ApiConfigService,
    private _seederService: SeederService,
  ) {}

  @Timeout(1000)
  async handleStartupTasks(): Promise<void> {
    this.logger.log('Startup Tasks');
    if (this.appConfig.enableSeeding) {
      try {
        this._seederService.runs();
        this.logger.log('Seed data complete');
      } catch (err) {
        this.logger.error(err);
      }
    }
  }
}
