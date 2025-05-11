import { Mapper } from '@automapper/core';
import { InjectMapper } from '@automapper/nestjs';
import { BadRequestException, Injectable } from '@nestjs/common';
import { difference } from 'lodash';
import type { FindOneOptions, SelectQueryBuilder } from 'typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { Transactional } from 'typeorm-transactional';

import { PaginationRequestDto } from '../../../common/dto/pagination-request.dto';
import { PaginationResponseDto } from '../../../common/dto/pagination-response.dto';
import { NullableType } from '../../../common/types/nullable.type';
import { W24Error } from '../../../constants/error-code';
import { CategoryNotFoundException } from '../../../exceptions/category-not-found.exception';
import { LoggerService } from '../../../shared/services/logger.service';
import { CategoryDto } from '../dtos/category.dto';
import {
  CreateCategoryDto,
  UpdateCategoryDto,
} from '../dtos/requests/create-category.dto';
import { CategoryEntity } from '../entities/category.entity';
import { ProductEntity } from '../entities/product.entity';

@Injectable()
export class CategoryService {
  private _categoryRepository: Repository<CategoryEntity>;
  private _productRepository: Repository<ProductEntity>;

  constructor(
    @InjectMapper() private readonly _mapper: Mapper,
    private readonly _dataSource: DataSource,
    private readonly _logger: LoggerService,
  ) {
    this._categoryRepository = this._dataSource.getRepository(CategoryEntity);
    this._productRepository = this._dataSource.getRepository(ProductEntity);
  }

  public findOne(
    findData: FindOneOptions<CategoryEntity>,
  ): Promise<NullableType<CategoryEntity>> {
    return this._categoryRepository.findOne(findData);
  }

  @Transactional()
  public async create(request: CreateCategoryDto): Promise<CategoryDto> {
    try {
      const entity = this._mapper.map(
        request,
        CreateCategoryDto,
        CategoryEntity,
      );

      const category = await this._categoryRepository.save(entity);

      const productIds = request.productIds || [];

      if (productIds.length) {
        await this._productRepository.update(
          { id: In(productIds) },
          { categoryId: category.id },
        );
      }

      return this._mapper.map(category, CategoryEntity, CategoryDto);
    } catch (error) {
      this._logger.error(error);
      throw new BadRequestException(error);
    }
  }

  @Transactional()
  public async update(request: UpdateCategoryDto): Promise<boolean> {
    try {
      const currEntity = await this._categoryRepository
        .createQueryBuilder('categories')
        .leftJoinAndSelect('categories.products', 'products')
        .where({ id: request.id })
        .select(['categories', 'products.id'])
        .getOne();

      if (!currEntity) {
        throw new CategoryNotFoundException();
      }

      const entity = this._mapper.map(
        request,
        UpdateCategoryDto,
        CategoryEntity,
      );

      await this._syncProductsOfCategory(request, currEntity);

      const category = await this._categoryRepository.save(entity);
      return !!category;
    } catch (error) {
      this._logger.error(error);
      throw new BadRequestException(error);
    }
  }

  private async _syncProductsOfCategory(
    request: UpdateCategoryDto,
    entity: CategoryEntity,
  ) {
    const currProductIds = entity.products?.map((e) => e.id) || [];
    const requestProductIds = request.productIds || [];

    const removeProductIds = difference(currProductIds, requestProductIds);
    const newProductIds = difference(requestProductIds, currProductIds);

    // Update products
    const tasks = [];
    if (removeProductIds.length) {
      tasks.push(
        this._productRepository.update(
          { id: In(removeProductIds) },
          { categoryId: null },
        ),
      );
    }
    if (newProductIds.length) {
      tasks.push(
        this._productRepository.update(
          { id: In(newProductIds) },
          { categoryId: entity.id },
        ),
      );
    }
    await Promise.all(tasks);
  }

  public async delete(id: string): Promise<boolean> {
    const category = await this._categoryRepository.findOneBy({ id });
    if (!category) {
      throw new BadRequestException(W24Error.NotFound('Category'));
    }

    const result = await this._categoryRepository.softRemoveAndSave(category);
    return !!result;
  }

  public async getCategories(
    query: PaginationRequestDto,
  ): Promise<PaginationResponseDto<CategoryDto>> {
    const queryBuilder: SelectQueryBuilder<CategoryEntity> =
      this._categoryRepository.createQueryBuilder('categories');
    const [items, meta] = await queryBuilder
      .leftJoinAndSelect('categories.products', 'products')
      .orderBy('categories.name', query.order)
      .paginate(query);

    const dtos: CategoryDto[] = this._mapper.mapArray(
      items,
      CategoryEntity,
      CategoryDto,
    );
    return dtos.toPagination(meta);
  }

  public async getCategory(id: string): Promise<CategoryDto> {
    const entity: NullableType<CategoryEntity> = await this.findOne({
      where: { id },
      relations: { products: true },
    });

    if (!entity) {
      throw new CategoryNotFoundException();
    }

    return this._mapper.map(entity, CategoryEntity, CategoryDto);
  }
}
