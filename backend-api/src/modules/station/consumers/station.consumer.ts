import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';

import { QUEUE } from '../../../constants';
import { DeviceService } from '../../device/services/device.service';
import { StationCacheService } from '../cache/station-cache.service';
import { StationProcessEnum } from '../enums/station-process.enum';
import { StationUtils } from '../utils/station.utils';

@Processor(QUEUE.STATION)
export class StationConsumer {
  constructor(
    private _cache: StationCacheService,
    private _deviceService: DeviceService,
  ) {}

  @Process(StationProcessEnum.UPDATE_DEVICE)
  async updateDevice(job: Job<string>) {
    const { data: stationId } = job;

    const stations = await this._cache.get();
    if (!stations.length) return;

    const station = stations.find((s) => s.id === stationId);
    if (!station) return;

    // Get devices by station
    const devices = await this._deviceService.getDevicesByStation([stationId]);
    const updatedStation = StationUtils.buildStationDevice(
      station,
      devices || [],
    );

    // Update stations
    const updatedStations = stations.map((_station) =>
      _station.id === stationId ? updatedStation : _station,
    );

    return this._cache.set(updatedStations);
  }
}
