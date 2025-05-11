import { Mapper } from '@automapper/core';
import { InjectMapper } from '@automapper/nestjs';
import { BadRequestException, Injectable } from '@nestjs/common';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { DataSource, Repository } from 'typeorm';

import { LoggerService } from '../../../shared/services/logger.service';
import { NflowService } from '../../nflow/services/nflow.service';
import { SettingDto } from '../dtos/setting.dto';
import { VoucherExcludedReasonDto } from '../dtos/voucher-excluded-reason.dto';
import { SettingEntity } from '../entities/setting.entity';
import { SettingKey } from '../enums/setting-key.enum';

dayjs.extend(utc);
@Injectable()
export class SettingService {
  private readonly _settingRepository: Repository<SettingEntity>;

  constructor(
    @InjectMapper() private readonly _mapper: Mapper,
    private readonly _dataSource: DataSource,
    private readonly _logger: LoggerService,
    private readonly _nflowService: NflowService,
  ) {
    this._settingRepository = this._dataSource.getRepository(SettingEntity);
  }

  public async update(dto: SettingDto): Promise<SettingDto> {
    try {
      const entity = this._mapper.map(dto, SettingDto, SettingEntity);

      const existEntity = await this._settingRepository.findOneBy({
        key: dto.key,
      });
      if (existEntity) {
        entity.id = existEntity.id;
      }

      const updatedEntity = await this._settingRepository.save(entity);
      return this._mapper.map(updatedEntity, SettingEntity, SettingDto);
    } catch (error) {
      this._logger.error(error);
      throw new BadRequestException(error);
    }
  }

  public async getSettings(): Promise<SettingDto[]> {
    try {
      const settings = await this._settingRepository.find();
      return this._mapper.mapArray(settings, SettingEntity, SettingDto);
    } catch (error) {
      this._logger.error(error);
      throw new BadRequestException(error);
    }
  }

  public async getVoucherExcludedReason(): Promise<VoucherExcludedReasonDto> {
    const now = dayjs().utc();

    try {
      const setting = await this._settingRepository.findOneBy({
        key: SettingKey.VOUCHER_EXCLUDED_REASON,
      });

      if (!setting || !setting.value) {
        return {
          reason: '',
          isExcluded: false,
        };
      }

      const events = await this._nflowService.getEvents();
      const isExcluded = (events || []).some((e) => {
        const start = dayjs(e.start).utc();
        const end = dayjs(e.end).utc();
        return now.isBetween(start, end, null, '[]');
      });

      return {
        reason: setting.value,
        isExcluded: isExcluded,
      };
    } catch (error) {
      this._logger.error(error);
      throw new BadRequestException(error);
    }
  }
}
