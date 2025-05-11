import { Mapper } from '@automapper/core';
import { InjectMapper } from '@automapper/nestjs';
import { BadRequestException, Injectable } from '@nestjs/common';
import type { FindOneOptions, SelectQueryBuilder } from 'typeorm';
import { DataSource, Not, Repository } from 'typeorm';

import { PaginationRequestDto } from '../../../common/dto/pagination-request.dto';
import { PaginationResponseDto } from '../../../common/dto/pagination-response.dto';
import { NullableType } from '../../../common/types/nullable.type';
import { W24Error } from '../../../constants/error-code';
import { ProductNotFoundException } from '../../../exceptions/product-not-found.exception';
import { LoggerService } from '../../../shared/services/logger.service';
import { UploadService } from '../../../shared/services/upload.service';
import { ProductDto } from '../dtos/product.dto';
import {
  CreateProductDto,
  UpdateProductDto,
} from '../dtos/requests/create-product.dto';
import { ModeEntity } from '../entities/mode.entity';
import { ProductEntity } from '../entities/product.entity';

@Injectable()
export class ProductService {
  private _productRepository: Repository<ProductEntity>;

  constructor(
    @InjectMapper() private readonly _mapper: Mapper,
    private _dataSource: DataSource,
    private readonly _upload: UploadService,
    private readonly _logger: LoggerService,
  ) {
    this._productRepository = this._dataSource.getRepository(ProductEntity);
  }

  public findOne(
    findData: FindOneOptions<ProductEntity>,
  ): Promise<NullableType<ProductEntity>> {
    return this._productRepository.findOne(findData);
  }

  public async create(dto: CreateProductDto): Promise<ProductDto> {
    try {
      const entity: ProductEntity = this._mapper.map(
        dto,
        CreateProductDto,
        ProductEntity,
      );

      if (entity.sku) {
        const isSkuValid = await this._validateSku(null, entity.sku);
        if (!isSkuValid) {
          throw new BadRequestException(W24Error.AlreadyExists('SKU'));
        }
      }

      const product = await this._productRepository.save(entity);
      return this._mapper.map(product, ProductEntity, ProductDto);
    } catch (error) {
      this._logger.error(error);
      throw new BadRequestException(error);
    }
  }

  public async update(request: UpdateProductDto): Promise<boolean> {
    try {
      const currProduct = await this._productRepository.findOneBy({
        id: request.id,
      });
      if (!currProduct) throw new ProductNotFoundException();

      const updateEntity = this._mapper.map(
        request,
        UpdateProductDto,
        ProductEntity,
      );

      if (updateEntity.sku) {
        const isSkuValid: boolean = await this._validateSku(
          updateEntity.id,
          updateEntity.sku,
        );
        if (!isSkuValid) {
          throw new BadRequestException(W24Error.AlreadyExists('SKU'));
        }
      }

      await this._updateImage(updateEntity, currProduct);
      const result = await this._productRepository.save(updateEntity);

      return !!result;
    } catch (error) {
      this._logger.error(error);
      throw new BadRequestException(error);
    }
  }

  private async _updateImage(
    updateEntity: ProductEntity,
    entity: ProductEntity,
  ): Promise<void> {
    try {
      // Delete old image
      const isDifferentImage =
        entity.featureImageUrl &&
        entity.featureImageUrl !== updateEntity.featureImageUrl;

      if (isDifferentImage) {
        await this._upload.deleteImages(entity.featureImageUrl ?? '');
      }
    } catch (error) {
      this._logger.error(error);
    }
  }

  public async delete(id: string): Promise<boolean> {
    try {
      const product = await this._productRepository.findOne({
        where: { id },
      });

      if (!product) throw new ProductNotFoundException();

      return this._dataSource.transaction(async (manager) => {
        await manager.getRepository(ProductEntity).softRemoveAndSave(product);

        // ! Remove modes
        const modeRepo = manager.getRepository(ModeEntity);
        const modes = await modeRepo.findBy({ productId: product.id });
        await modeRepo.softRemoveAndSave(modes);

        return true;
      });
    } catch (error) {
      this._logger.error(error);
      throw new BadRequestException(error);
    }
  }

  public async getProducts(
    query: PaginationRequestDto,
  ): Promise<PaginationResponseDto<ProductDto>> {
    const queryBuilder: SelectQueryBuilder<ProductEntity> =
      this._productRepository.createQueryBuilder('products');
    const [items, meta] = await queryBuilder
      .leftJoinAndSelect('products.category', 'category')
      .orderBy('products.name', query.order)
      .paginate(query);

    const dtos: ProductDto[] = this._mapper.mapArray(
      items,
      ProductEntity,
      ProductDto,
    );
    return dtos.toPagination(meta);
  }

  public async getProduct(id: string): Promise<ProductDto> {
    const entity = await this._productRepository.findOneBy({ id });
    if (!entity) throw new ProductNotFoundException();

    return this._mapper.map(entity, ProductEntity, ProductDto);
  }

  private async _validateSku(
    id?: NullableType<string>,
    sku?: string,
  ): Promise<boolean> {
    if (!sku) return true;

    const builder = this._productRepository
      .createQueryBuilder('products')
      .where({ sku });

    if (id) {
      builder.andWhere({ id: Not(id) });
    }

    const count = await builder.getCount();
    return count === 0;
  }
}
