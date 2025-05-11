import { Module } from '@nestjs/common';

import { SharedModule } from '../../shared/shared.module';
import { ChatwootService } from './services/chatwoot.service';

@Module({
  imports: [SharedModule],
  providers: [ChatwootService],
  exports: [ChatwootService],
})
export class ChatwootModule {}
