import { Module } from '@nestjs/common';

import { SharedModule } from '../../shared/shared.module';
import { NflowService } from './services/nflow.service';

@Module({
  imports: [SharedModule],
  exports: [NflowService],
  providers: [NflowService],
})
export class NflowSharedModule {}
