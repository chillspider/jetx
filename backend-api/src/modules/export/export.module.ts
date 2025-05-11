import { Module } from '@nestjs/common';

import { SharedModule } from '../../shared/shared.module';
import { ExportService } from './services/export.service';

@Module({
  imports: [SharedModule],
  providers: [ExportService],
  controllers: [],
  exports: [ExportService],
})
export class ExportModule {}
