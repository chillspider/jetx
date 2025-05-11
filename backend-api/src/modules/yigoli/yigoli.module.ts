import { Module } from '@nestjs/common';

import { SharedModule } from '../../shared/shared.module';
import { YigoliService } from './services/yigoli.service';

@Module({
  imports: [SharedModule],
  exports: [YigoliService],
  providers: [YigoliService],
})
export class YigoliModule {}
