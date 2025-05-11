import { Mapper } from '@automapper/core';
import { InjectMapper } from '@automapper/nestjs';
import { BadRequestException, Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';

import { LoggerService } from '../../../shared/services/logger.service';
import { ActivityLogDto } from '../dtos/activity-log.dto';
import { ActivityLogEntity } from '../entities/activity-log.entity';

@Injectable()
export class ActivityLogService {
  private readonly _activityLog: Repository<ActivityLogEntity>;
  constructor(
    @InjectMapper() readonly _mapper: Mapper,
    private readonly _dataSource: DataSource,
    private readonly _logger: LoggerService,
  ) {
    this._activityLog = this._dataSource.getRepository(ActivityLogEntity);
  }

  async create(dto: ActivityLogDto): Promise<ActivityLogDto> {
    try {
      const entity = this._mapper.map(dto, ActivityLogDto, ActivityLogEntity);
      const result = await this._activityLog.save(entity);

      return this._mapper.map(result, ActivityLogEntity, ActivityLogDto);
    } catch (error) {
      this._logger.error(error);
      throw new BadRequestException(error);
    }
  }
}
