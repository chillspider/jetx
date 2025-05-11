import { Mapper } from '@automapper/core';
import { InjectMapper } from '@automapper/nestjs';
import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Queue } from 'bull';
import { DataSource, Repository } from 'typeorm';

import { EVENT, QUEUE } from '../../../constants';
import { DeviceService } from '../../device/services/device.service';
import { StationCacheService } from '../cache/station-cache.service';
import { StationDto } from '../dtos/station.dto';
import { StationEntity } from '../entities/station.entity';
import { StationProcessEnum } from '../enums/station-process.enum';
import { StationUtils } from '../utils/station.utils';

@Injectable()
export class StationListener {
  private _stationRepository: Repository<StationEntity>;

  constructor(
    @InjectMapper() private readonly _mapper: Mapper,
    @InjectQueue(QUEUE.STATION) private readonly _queue: Queue<string>,
    private readonly _dataSource: DataSource,
    private readonly _cache: StationCacheService,
    private readonly _deviceService: DeviceService,
  ) {
    this._stationRepository = this._dataSource.getRepository(StationEntity);
  }

  @OnEvent(EVENT.STATION.SYNC)
  async syncStations(): Promise<void> {
    const entities = await this._stationRepository.find({
      relations: ['location'],
    });
    if (!entities.length) return;

    let stations = this._mapper.mapArray(entities, StationEntity, StationDto);

    const stationIds = stations.map((station) => station.id);
    const devices = await this._deviceService.getDevicesByStation(stationIds);

    if (devices?.length) {
      stations = StationUtils.buildStationsDevices(stations, devices);
    }

    return this._cache.set(stations);
  }

  @OnEvent(EVENT.STATION.SET)
  async setStations(stations: StationDto[]): Promise<void> {
    return this._cache.set(stations);
  }

  @OnEvent(EVENT.STATION.UPDATE_DEVICE)
  async updateDevice(stationId: string | string[]): Promise<void> {
    if (!stationId) return;

    if (typeof stationId === 'string') {
      this._queue.add(StationProcessEnum.UPDATE_DEVICE, stationId);
      return;
    }

    for (const id of stationId) {
      await this._queue.add(StationProcessEnum.UPDATE_DEVICE, id);
    }
  }
}
