import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import { EVENT } from '../../../constants';
import { ActivityLogDto } from '../dtos/activity-log.dto';
import { ActivityLogService } from '../services/activity-log.service';

@Injectable()
export class ActivityLogListener {
  constructor(private readonly _activityLogService: ActivityLogService) {}

  @OnEvent(EVENT.ACTIVITY_LOG)
  async handleActivityLog(data: ActivityLogDto): Promise<void> {
    await this._activityLogService.create(data);
  }
}
