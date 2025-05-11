import { Mapper } from '@automapper/core';
import { InjectMapper } from '@automapper/nestjs';
import { BadRequestException, Injectable } from '@nestjs/common';
import { DataSource, In, Repository } from 'typeorm';

import { PaginationRequestDto } from '../../../common/dto/pagination-request.dto';
import { PaginationResponseDto } from '../../../common/dto/pagination-response.dto';
import { W24Error } from '../../../constants/error-code';
import { LoggerService } from '../../../shared/services/logger.service';
import { DeviceEntity } from '../../device/entities/device.entity';
import { ModeAndProductDto, ModeDto } from '../../product/dtos/mode.dto';
import { ModeEntity } from '../../product/entities/mode.entity';
import { ProductEntity } from '../../product/entities/product.entity';
import { CreateStationModeDto, StationModeDto } from '../dtos/station-mode.dto';
import { StationModeEntity } from '../entities/station-mode.entity';

@Injectable()
export class StationModeService {
  private readonly _stationModeRepository: Repository<StationModeEntity>;

  constructor(
    @InjectMapper() private readonly _mapper: Mapper,
    private readonly _logger: LoggerService,
    private readonly _dataSource: DataSource,
  ) {
    this._stationModeRepository =
      this._dataSource.getRepository(StationModeEntity);
  }

  public async create(dto: CreateStationModeDto): Promise<StationModeDto> {
    try {
      const entity = this._mapper.map(
        dto,
        CreateStationModeDto,
        StationModeEntity,
      );

      const entityExist = await this._stationModeRepository.findOneBy({
        stationId: entity.stationId,
        modeId: entity.modeId,
      });
      if (entityExist) {
        entity.id = entityExist.id;
      }

      const stationMode = await this._stationModeRepository.save(entity);
      return this._mapper.map(stationMode, StationModeEntity, StationModeDto);
    } catch (error) {
      this._logger.error(error);
      throw new BadRequestException(error);
    }
  }

  public async update(dto: StationModeDto): Promise<boolean> {
    try {
      const currStationMode = await this._stationModeRepository.findOneBy({
        id: dto.id,
      });
      if (!currStationMode) {
        throw new BadRequestException(W24Error.NotFound('Station_Mode'));
      }

      const entity = this._mapper.map(dto, StationModeDto, StationModeEntity);

      await this._stationModeRepository.save(entity);
      return true;
    } catch (error) {
      this._logger.error(error);
      throw new BadRequestException(error);
    }
  }

  public async delete(id: string): Promise<boolean> {
    try {
      await this._stationModeRepository.delete(id);
      return true;
    } catch (error) {
      this._logger.error(error);
      throw new BadRequestException(error);
    }
  }

  public async getProductModes({
    stationId,
    productId,
  }: {
    stationId: string;
    productId: string;
  }): Promise<ModeDto[]> {
    try {
      const modes = await this._dataSource
        .getRepository(ModeEntity)
        .findBy({ productId });
      if (!modes?.length) return [];

      const stationModes = await this._dataSource
        .getRepository(StationModeEntity)
        .findBy({ stationId, modeId: In(modes.map((m) => m.id)) });

      return modes.map((e) => {
        const mode = this._mapper.map(e, ModeEntity, ModeDto);
        const stationMode = stationModes?.find((sm) => sm.modeId === e.id);

        mode.price = stationMode?.price || e.price;

        return mode;
      });
    } catch (error) {
      this._logger.error(error);
      return [];
    }
  }

  public async getStationModes(
    query: PaginationRequestDto,
  ): Promise<PaginationResponseDto<StationModeDto>> {
    try {
      const builder = this._stationModeRepository.createQueryBuilder('sm');

      const [items, meta] = await builder
        .orderBy('sm.price', query.order)
        .paginate(query);

      const dtos = this._mapper.mapArray(
        items,
        StationModeEntity,
        StationModeDto,
      );
      return dtos.toPagination(meta);
    } catch (error) {
      this._logger.error(error);
      throw new BadRequestException(error);
    }
  }

  public async getStationMode(id: string): Promise<StationModeDto> {
    const entity = await this._stationModeRepository.findOneBy({ id });
    if (!entity) {
      throw new BadRequestException(W24Error.NotFound('Station_Mode'));
    }

    return this._mapper.map(entity, StationModeEntity, StationModeDto);
  }

  public async getByStation(id: string): Promise<ModeAndProductDto[]> {
    try {
      const [modes, stationModes] = await Promise.all([
        this.getModesByStation(id),
        this._stationModeRepository.findBy({ stationId: id }),
      ]);

      return modes.map((mode) => {
        const stationMode = stationModes.find((sm) => sm.modeId === mode.id);

        return {
          ...mode,
          price: stationMode?.price || mode.price,
        };
      });
    } catch (error) {
      this._logger.error(error);
      throw new BadRequestException(error);
    }
  }

  private async getModesByStation(id: string): Promise<ModeAndProductDto[]> {
    try {
      const devices = await this._dataSource
        .getRepository(DeviceEntity)
        .findBy({ stationId: id });
      if (!devices?.length) return [];

      const productIds = devices.map((device) => device.productId);
      const [products, modes] = await Promise.all([
        this._dataSource.getRepository(ProductEntity).findBy({
          id: In(productIds),
        }),
        this._dataSource.getRepository(ModeEntity).findBy({
          productId: In(productIds),
        }),
      ]);
      if (!modes?.length) return [];

      const dtos = this._mapper.mapArray(modes, ModeEntity, ModeAndProductDto);

      dtos.forEach((mode) => {
        const product = products.find((p) => p.id === mode.productId);
        mode.productName = product.name;
        mode.stationId = id;
      });

      return dtos;
    } catch (error) {
      this._logger.error(error);
      throw new BadRequestException(error);
    }
  }
}
