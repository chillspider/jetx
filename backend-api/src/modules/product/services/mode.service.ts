import { Mapper } from '@automapper/core';
import { InjectMapper } from '@automapper/nestjs';
import { BadRequestException, Injectable } from '@nestjs/common';
import { DataSource, Not, Repository } from 'typeorm';

import { PaginationResponseDto } from '../../../common/dto/pagination-response.dto';
import { W24Error } from '../../../constants/error-code';
import { LoggerService } from '../../../shared/services/logger.service';
import { StationModeEntity } from '../../station/entities/station-mode.entity';
import { ModeDto } from '../dtos/mode.dto';
import { CreateModeDto, UpdateModeDto } from '../dtos/requests/create-mode-dto';
import { ModePaginationRequestDto } from '../dtos/requests/mode-pagination.dto';
import { ModeEntity } from '../entities/mode.entity';
import { ProductService } from './product.service';

@Injectable()
export class ModeService {
  private _modeRepository: Repository<ModeEntity>;

  constructor(
    @InjectMapper() private readonly _mapper: Mapper,
    private readonly _dataSource: DataSource,
    private readonly _logger: LoggerService,
    private readonly _productService: ProductService,
  ) {
    this._modeRepository = this._dataSource.getRepository(ModeEntity);
  }

  public async create(dto: CreateModeDto): Promise<ModeDto> {
    try {
      const entity = this._mapper.map(dto, CreateModeDto, ModeEntity);

      const isCodeValid = await this._validateCode({
        code: entity.code,
        productId: entity.productId,
      });
      if (!isCodeValid) {
        throw new BadRequestException(W24Error.AlreadyExists('Code'));
      }

      const product = await this._productService.findOne({
        where: { id: entity.productId },
      });
      if (!product) {
        throw new BadRequestException(W24Error.NotFound('Product'));
      }

      const mode = await this._modeRepository.save(entity);
      return this._mapper.map(mode, ModeEntity, ModeDto);
    } catch (error) {
      this._logger.error(error);
      throw new BadRequestException(error);
    }
  }

  public async update(dto: UpdateModeDto): Promise<boolean> {
    try {
      const currMode = await this._modeRepository.findOneBy({ id: dto.id });
      if (!currMode) {
        throw new BadRequestException(W24Error.NotFound('Mode'));
      }

      const entity = this._mapper.map(dto, UpdateModeDto, ModeEntity);

      const isCodeValid = await this._validateCode({
        code: entity.code,
        productId: entity.productId,
        id: entity.id,
      });
      if (!isCodeValid) {
        throw new BadRequestException(W24Error.AlreadyExists('Code'));
      }

      const product = await this._productService.findOne({
        where: { id: entity.productId },
      });
      if (!product) {
        throw new BadRequestException(W24Error.NotFound('Product'));
      }

      await this._modeRepository.save(entity);
      return true;
    } catch (error) {
      this._logger.error(error);
      throw new BadRequestException(error);
    }
  }

  public async delete(id: string): Promise<boolean> {
    try {
      return this._dataSource.transaction(async (manager) => {
        const repo = manager.getRepository(ModeEntity);
        const mode = await repo.findOneBy({ id });
        if (!mode) {
          throw new BadRequestException(W24Error.NotFound('Mode'));
        }

        await repo.softRemoveAndSave(mode);
        await manager.getRepository(StationModeEntity).delete({ modeId: id });

        return true;
      });
    } catch (error) {
      this._logger.error(error);
      throw new BadRequestException(error);
    }
  }

  public async getModes(
    query: ModePaginationRequestDto,
  ): Promise<PaginationResponseDto<ModeDto>> {
    try {
      const builder = this._modeRepository.createQueryBuilder('modes');

      if (query.productId) {
        builder.andWhere({ productId: query.productId });
      }

      const [items, meta] = await builder
        .orderBy('modes.name', query.order)
        .paginate(query);

      const dtos = this._mapper.mapArray(items, ModeEntity, ModeDto);
      return dtos.toPagination(meta);
    } catch (error) {
      this._logger.error(error);
      throw new BadRequestException(error);
    }
  }

  public async getMode(id: string): Promise<ModeDto> {
    const entity = await this._modeRepository.findOneBy({ id });
    if (!entity) {
      throw new BadRequestException(W24Error.NotFound('Mode'));
    }

    return this._mapper.map(entity, ModeEntity, ModeDto);
  }

  private async _validateCode({
    code,
    productId,
    id,
  }: {
    code: string;
    productId: string;
    id?: string;
  }): Promise<boolean> {
    const builder = this._modeRepository
      .createQueryBuilder('modes')
      .where({ code: code, productId: productId })
      .select(['modes.id']);

    if (id) {
      builder.andWhere({ id: Not(id) });
    }

    const mode = await builder.getOne();
    return !mode;
  }
}
