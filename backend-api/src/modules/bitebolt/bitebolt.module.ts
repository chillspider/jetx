import { Module } from '@nestjs/common';

import { SharedModule } from '../../shared/shared.module';
import { BiteboltController } from './controllers/bitebolt.controller';
import { BiteboltService } from './services/bitebolt.service';

@Module({
  imports: [SharedModule],
  controllers: [BiteboltController],
  providers: [BiteboltService],
  exports: [BiteboltService],
})
export class BiteboltModule {}
