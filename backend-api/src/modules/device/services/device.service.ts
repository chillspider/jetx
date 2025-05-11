import { Mapper } from '@automapper/core';
import { InjectMapper } from '@automapper/nestjs';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { isUUID } from 'class-validator';
import type { FindOneOptions } from 'typeorm';
import { DataSource, In, IsNull, Not, Repository } from 'typeorm';
import { Transactional } from 'typeorm-transactional';

import { PaginationRequestDto } from '../../../common/dto/pagination-request.dto';
import { PaginationResponseDto } from '../../../common/dto/pagination-response.dto';
import { NullableType } from '../../../common/types/nullable.type';
import { EVENT, LANGUAGE } from '../../../constants';
import { W24Error } from '../../../constants/error-code';
import { LocalizeService } from '../../../shared/services/localize.service';
import { LoggerService } from '../../../shared/services/logger.service';
import { GPayQRInfo } from '../../payment/dtos/gpay/gpay-qr-response';
import { GpayQRService } from '../../payment/services/gpay-qr.service';
import { StationModeService } from '../../station/services/station-mode.service';
import { MachineInfoDto } from '../../yigoli/dtos/machine-info.dto';
import { YigoliService } from '../../yigoli/services/yigoli.service';
import { AttentionDto } from '../dtos/attention.dto';
import { DeviceAndModeDto, DeviceDto } from '../dtos/device.dto';
import {
  CreateDeviceDto,
  UpdateDeviceDto,
} from '../dtos/requests/create-device.dto';
import { AttentionEntity } from '../entities/attention.entity';
import { DeviceEntity } from '../entities/device.entity';
import { DeviceAttentionEntity } from '../entities/device-attention.entity';
import { DeviceStatusEnum } from '../enums/device-status.enum';

@Injectable()
export class DeviceService {
  private _deviceRepository: Repository<DeviceEntity>;
  private _attentionEntity: Repository<AttentionEntity>;
  private _deviceAttentionEntity: Repository<DeviceAttentionEntity>;

  constructor(
    @InjectMapper() private readonly _mapper: Mapper,
    @Inject(LANGUAGE) private readonly lang: string,
    private _dataSource: DataSource,
    private readonly _logger: LoggerService,
    private readonly _localizeAttention: LocalizeService<AttentionEntity>,
    private readonly _yigoli: YigoliService,
    private readonly _emitter: EventEmitter2,
    private readonly _stationModeService: StationModeService,
    private readonly _gpayQRService: GpayQRService,
  ) {
    this._deviceRepository = this._dataSource.getRepository(DeviceEntity);
    this._attentionEntity = this._dataSource.getRepository(AttentionEntity);
    this._deviceAttentionEntity = this._dataSource.getRepository(
      DeviceAttentionEntity,
    );
  }

  public findOne(
    findData: FindOneOptions<DeviceEntity>,
  ): Promise<NullableType<DeviceEntity>> {
    return this._deviceRepository.findOne(findData);
  }

  public async create(dto: CreateDeviceDto): Promise<DeviceDto> {
    try {
      const entity = this._mapper.map(dto, CreateDeviceDto, DeviceEntity);

      if (entity.deviceNo) {
        const isDNValid = await this._validateDeviceNo(null, entity.deviceNo);
        if (!isDNValid) {
          throw new BadRequestException(W24Error.AlreadyExists('Device'));
        }
      }

      entity.deviceAttentions = (dto.attentions || []).map((e) => {
        const de = new DeviceAttentionEntity();
        de.attentionId = e;
        return de;
      });

      const result = await this._deviceRepository.save(entity);
      if (!result) throw new BadRequestException(W24Error.UnexpectedError);

      this._emitter.emit(EVENT.DEVICE.GENERATE_QR, result.id);
      this._syncDeviceCacheForStation(result.stationId);
      return this._mapper.map(result, DeviceEntity, DeviceDto);
    } catch (error) {
      this._logger.error(error);
      throw new BadRequestException(error);
    }
  }

  @Transactional()
  public async update(dto: UpdateDeviceDto): Promise<boolean> {
    try {
      const currDevice = await this._deviceRepository.findOne({
        where: { id: dto.id },
        relations: ['deviceAttentions'],
      });
      if (!currDevice)
        throw new BadRequestException(W24Error.NotFound('Device'));

      const entity = this._mapper.map(dto, UpdateDeviceDto, DeviceEntity);

      if (entity.deviceNo) {
        const isDNValid = await this._validateDeviceNo(
          entity.id,
          entity.deviceNo,
        );
        if (!isDNValid) {
          throw new BadRequestException(W24Error.AlreadyExists('Device'));
        }
      }

      const deviceAttentionIds = dto.attentions ?? [];
      const removeDeviceAttentionIds = (currDevice.deviceAttentions ?? [])
        .filter((e) => !deviceAttentionIds.includes(e.id))
        .map((e) => e.id);

      if (removeDeviceAttentionIds.length) {
        await this._deviceAttentionEntity.delete(removeDeviceAttentionIds);
      }
      entity.deviceAttentions = (dto.attentions || []).map((e) => {
        const de = new DeviceAttentionEntity();
        de.attentionId = e;
        de.deviceId = entity.id;
        return de;
      });

      const result = await this._deviceRepository.save(entity);

      this._syncDeviceCacheForStation(result.stationId);
      return !!result;
    } catch (error) {
      this._logger.error(error);
      throw new BadRequestException(error);
    }
  }

  public async delete(id: string): Promise<boolean> {
    try {
      const currDevice = await this._deviceRepository.findOne({
        where: { id: id },
      });
      if (!currDevice)
        throw new BadRequestException(W24Error.NotFound('Device'));

      if (currDevice.status === DeviceStatusEnum.PROCESSING) {
        throw new BadRequestException(W24Error.DeviceNotAvailable);
      }

      const result = await this._deviceRepository.delete(id);

      this._syncDeviceCacheForStation(currDevice.stationId);
      return !!result?.affected;
    } catch (error) {
      this._logger.error(error);
      throw new BadRequestException(error);
    }
  }

  public async getDevicesByStation(stationIds: string[]): Promise<DeviceDto[]> {
    try {
      const devices = await this._deviceRepository.find({
        where: { stationId: In(stationIds) },
      });
      if (!devices?.length) return [];

      return this._mapper.mapArray(devices, DeviceEntity, DeviceDto);
    } catch (error) {
      this._logger.error(error);
      return [];
    }
  }

  public async getDevices(
    query: PaginationRequestDto,
  ): Promise<PaginationResponseDto<DeviceDto>> {
    const builder = this._deviceRepository
      .createQueryBuilder('devices')
      .orderBy('devices.createdAt', query.order);

    const [items, meta] = await builder.paginate(query);

    const dtos = this._mapper.mapArray(items, DeviceEntity, DeviceDto);
    return dtos.toPagination(meta);
  }

  public async getDevice(id: string): Promise<DeviceAndModeDto> {
    const builder = this._deviceRepository
      .createQueryBuilder('devices')
      .leftJoinAndSelect('devices.deviceAttentions', 'deviceAttentions');

    if (isUUID(id)) {
      builder.where({ id });
    } else {
      builder
        .where({ deviceNo: id })
        .orWhere(
          `devices.qr IS NOT NULL  AND ("devices"."qr"::jsonb->>'qrInfo') =:qrInfo`,
          { qrInfo: id },
        );
    }

    const entity = await builder.getOne();
    if (!entity) {
      throw new BadRequestException(W24Error.NotFound('Device'));
    }

    const dto = this._mapper.map(entity, DeviceEntity, DeviceAndModeDto);

    const attentionIds = (entity.deviceAttentions ?? []).map(
      (a) => a.attentionId,
    );
    if (attentionIds?.length) {
      let attentions = await this._attentionEntity.find({
        where: { id: In(attentionIds) },
      });

      attentions = this._localizeAttention.localizeArray(attentions, this.lang);
      dto.attentions = this._mapper.mapArray(
        attentions,
        AttentionEntity,
        AttentionDto,
      );
    }

    dto.modes = await this._stationModeService.getProductModes({
      stationId: entity.stationId,
      productId: entity.productId,
    });

    return dto;
  }

  public async getDeviceStatus(id: string): Promise<MachineInfoDto> {
    const builder = this._deviceRepository.createQueryBuilder('devices');

    if (isUUID(id)) {
      builder.where({ id });
    } else {
      builder
        .where({ deviceNo: id })
        .orWhere(
          `devices.qr IS NOT NULL  AND ("devices"."qr"::jsonb->>'qrInfo') =:qrInfo`,
          { qrInfo: id },
        );
    }

    const device = await builder.getOne();
    if (!device) throw new BadRequestException(W24Error.NotFound('Device'));

    const deviceNo = device.deviceNo;
    if (!deviceNo) throw new BadRequestException(W24Error.NotFound('DeviceNo'));

    return this._yigoli.getMachineInfo(deviceNo);
  }

  /**
   * When device is changed, we need to sync the device cache for the station.
   * @param stationId The ID of the station to sync the device cache for.
   */
  private async _syncDeviceCacheForStation(stationId: string): Promise<void> {
    this._emitter.emit(EVENT.STATION.UPDATE_DEVICE, stationId);
  }

  private async _validateDeviceNo(
    id?: string,
    deviceNo?: string,
  ): Promise<boolean> {
    if (!deviceNo) return true;

    const builder = this._deviceRepository
      .createQueryBuilder('devices')
      .where({ deviceNo });

    if (id) {
      builder.andWhere({ id: Not(id) });
    }

    const count = await builder.getCount();
    return count === 0;
  }

  public async generateQRById(id: string): Promise<boolean> {
    try {
      const device = await this._deviceRepository.findOneBy({ id });
      if (!device) throw new BadRequestException(W24Error.NotFound('Device'));

      device.qr = await this.generateDeviceQRInfo(device);
      await this._deviceRepository.save(device);

      return !!device.qr;
    } catch (error) {
      this._logger.error(error);
      throw new BadRequestException(error);
    }
  }

  public async generateQRAllDevices(): Promise<boolean> {
    try {
      const devices = await this._deviceRepository.findBy({ qr: IsNull() });
      if (!devices?.length) return true;

      for (const device of devices) {
        device.qr = await this.generateDeviceQRInfo(device);
      }

      await this._deviceRepository.save(devices);
      return true;
    } catch (error) {
      this._logger.error(error);
      throw new BadRequestException(error);
    }
  }

  public async generateDeviceQRInfo(device: DeviceEntity): Promise<GPayQRInfo> {
    try {
      const qr = await this._gpayQRService.generateQR({
        deviceId: device.id,
      });
      return qr;
    } catch (error) {
      this._logger.error(error);
      return null;
    }
  }
}
