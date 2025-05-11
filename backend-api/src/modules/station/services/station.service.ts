/* eslint-disable @typescript-eslint/no-unused-vars */
import { Mapper } from '@automapper/core';
import { InjectMapper } from '@automapper/nestjs';
import { BadRequestException, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { difference } from 'lodash';
import { DataSource, FindOptionsWhere, Repository } from 'typeorm';
import { Transactional } from 'typeorm-transactional';

import { PaginationResponseDto } from '../../../common/dto/pagination-response.dto';
import { LocationPoint } from '../../../common/types/location-point.type';
import { NullableType } from '../../../common/types/nullable.type';
import { getDistance } from '../../../common/utils';
import { EVENT } from '../../../constants';
import { W24Error } from '../../../constants/error-code';
import { LoggerService } from '../../../shared/services/logger.service';
import { UploadService } from '../../../shared/services/upload.service';
import { DeviceStatusEnum } from '../../device/enums/device-status.enum';
import { DeviceService } from '../../device/services/device.service';
import { StationCacheService } from '../cache/station-cache.service';
import {
  CreateStationDto,
  UpdateStationDto,
} from '../dtos/requests/create-station.dto';
import { StationDetailRequestDto } from '../dtos/requests/station-detail-request.dto';
import { StationListRequestDto } from '../dtos/requests/station-list-request.dto';
import { StationDto } from '../dtos/station.dto';
import { StationEntity } from '../entities/station.entity';
import { StationLocationEntity } from '../entities/station-location.entity';
import { StationModeEntity } from '../entities/station-mode.entity';
import { StationStatus } from '../enums/station-status.enum';
import { StationUtils } from '../utils/station.utils';

@Injectable()
export class StationService {
  private _stationRepository: Repository<StationEntity>;

  constructor(
    @InjectMapper() private readonly _mapper: Mapper,
    private _dataSource: DataSource,
    private readonly _deviceService: DeviceService,
    private readonly _upload: UploadService,
    private readonly _emitter: EventEmitter2,
    private readonly _cache: StationCacheService,
    private readonly _logger: LoggerService,
  ) {
    this._stationRepository = this._dataSource.getRepository(StationEntity);
  }

  public findOne(
    findData: FindOptionsWhere<StationEntity>,
  ): Promise<NullableType<StationEntity>> {
    return this._stationRepository.findOneBy(findData);
  }

  public async getStations(
    query: StationListRequestDto,
  ): Promise<PaginationResponseDto<StationDto>> {
    const cache = await this._getCachedPagingStations(query);
    if (cache?.data?.length) return cache;

    const entities = await this._stationRepository.find({
      relations: ['location'],
    });

    let stations = this._mapper.mapArray(entities, StationEntity, StationDto);

    const devices = await this._deviceService.getDevicesByStation(
      stations.map((station) => station.id),
    );
    if (devices?.length) {
      stations = StationUtils.buildStationsDevices(stations, devices);
    }

    this._emitter.emit(EVENT.STATION.SET, stations);

    return this._paginateStations(stations, query);
  }

  public async getStation(
    id: string,
    query?: StationDetailRequestDto,
  ): Promise<StationDto> {
    const cache = await this._getCachedStation(id, query);
    if (cache) return cache;

    const entity = await this._stationRepository.findOne({
      where: { id },
      relations: ['location'],
    });
    if (!entity) throw new BadRequestException(W24Error.NotFound('Station'));

    const dto = this._mapper.map(entity, StationEntity, StationDto);

    if (query?.latitude && query?.longitude) {
      dto.distance = this._estStationDistance(dto, {
        latitude: query.latitude,
        longitude: query.longitude,
      });
    }

    const devices = await this._deviceService.getDevicesByStation([id]);
    this._emitter.emit(EVENT.STATION.SYNC);

    return StationUtils.buildStationDevice(dto, devices);
  }

  @Transactional()
  public async create(request: CreateStationDto): Promise<StationDto> {
    try {
      const entity = this._mapper.map(request, CreateStationDto, StationEntity);

      const result = await this._stationRepository.save(entity);
      if (result) this._emitter.emit(EVENT.STATION.SYNC);

      return this._mapper.map(result, StationEntity, StationDto);
    } catch (error) {
      this._logger.error(error);
      throw new BadRequestException(error);
    }
  }

  @Transactional()
  public async update(request: UpdateStationDto): Promise<boolean> {
    try {
      const currentStation = await this._stationRepository.findOne({
        where: { id: request.id },
        relations: ['location'],
      });
      if (!currentStation) {
        throw new BadRequestException(W24Error.NotFound('Station'));
      }

      const entity = this._mapper.map(request, UpdateStationDto, StationEntity);

      await this._updateImages(entity, currentStation);

      entity.location.stationId = currentStation.id;
      entity.location.id = currentStation.location.id;

      const result = await this._stationRepository.save(entity);
      if (result) this._emitter.emit(EVENT.STATION.SYNC);

      return !!result;
    } catch (error) {
      this._logger.error(error);
      throw new BadRequestException(error);
    }
  }

  public async delete(id: string): Promise<boolean> {
    try {
      const station = await this._stationRepository.findOne({
        where: { id },
        relations: ['location'],
      });

      if (!station) throw new BadRequestException(W24Error.NotFound('Station'));

      const devices = await this._deviceService.getDevicesByStation([id]);
      const isProcessing = devices.some(
        (device) => device.status === DeviceStatusEnum.PROCESSING,
      );

      if (isProcessing) {
        throw new BadRequestException(W24Error.StationIsProcessing);
      }

      return this._dataSource.transaction(async (manager) => {
        await manager.getRepository(StationEntity).softRemoveAndSave(station);

        await manager
          .getRepository(StationModeEntity)
          .delete({ stationId: id });

        const location = station.location;
        if (location) {
          await manager
            .getRepository(StationLocationEntity)
            .softRemoveAndSave(location);
        }

        this._emitter.emit(EVENT.STATION.SYNC);

        return true;
      });
    } catch (error) {
      this._logger.error(error);
      throw new BadRequestException(error);
    }
  }

  private async _updateImages(
    updateEntity: StationEntity,
    currentEntity: StationEntity,
  ): Promise<void> {
    try {
      const currentImages = [
        ...currentEntity.images,
        currentEntity.featureImageUrl,
      ];
      const newImages = [...updateEntity.images, updateEntity.featureImageUrl];

      const removeImages = difference(currentImages, newImages).filter(
        (image) => !!image,
      );

      if (removeImages.length) {
        await this._upload.deleteImages(removeImages);
      }
    } catch (error) {
      this._logger.error(error);
    }
  }

  private async _getCachedPagingStations(
    query: StationListRequestDto,
  ): Promise<NullableType<PaginationResponseDto<StationDto>>> {
    try {
      const stations = await this._cache.get();
      if (!stations?.length) return null;

      return this._paginateStations(stations, query);
    } catch (error) {
      return null;
    }
  }

  private async _paginateStations(
    stations: StationDto[],
    query: StationListRequestDto,
  ): Promise<PaginationResponseDto<StationDto>> {
    let activeStations = stations.filter(
      (station) => station.status !== StationStatus.INACTIVE,
    );

    const latitude = query.latitude;
    const longitude = query.longitude;

    // Calculate distance
    if (latitude && longitude) {
      activeStations = activeStations.map((station) => {
        const distance = this._estStationDistance(station, {
          latitude,
          longitude,
        });

        return { ...station, distance: distance };
      });

      // Sort by distance ASC
      activeStations = activeStations.sort((a, b) => a.distance! - b.distance!);
    } else {
      // Sort by name ASC
      activeStations = activeStations.sort((a, b) =>
        a.name.localeCompare(b.name),
      );
    }

    return activeStations.paginate(query);
  }

  private async _getCachedStation(
    id: string,
    query?: StationDetailRequestDto,
  ): Promise<NullableType<StationDto>> {
    try {
      const stations = await this._cache.get();
      if (!stations?.length) return null;

      const station = stations.find((station) => station.id === id);
      if (!station) return null;

      if (query?.latitude && query?.longitude) {
        station.distance = this._estStationDistance(station, {
          latitude: query.latitude,
          longitude: query.longitude,
        });
      }

      return station;
    } catch (error) {
      return null;
    }
  }

  private _estStationDistance(
    station: StationDto,
    point: LocationPoint,
  ): number {
    const location = station.location;

    const distance = getDistance(
      {
        latitude: location.latitude,
        longitude: location.longitude,
      },
      point,
    );

    return distance;
  }
}
