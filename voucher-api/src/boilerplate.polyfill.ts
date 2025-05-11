/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/naming-convention */
import 'source-map-support/register';

import type { ObjectLiteral, SaveOptions } from 'typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';

import type { CreateTranslationDto } from './common/dto/create-translation.dto';
import { PaginationRequestDto } from './common/dto/pagination-request.dto';
import {
  PaginationMetaDto,
  PaginationResponseDto,
} from './common/dto/pagination-response.dto';
import type { AbstractEntity } from './common/entities/abstract.entity';
import type { LanguageCode } from './constants/language-code';
import { VIRTUAL_COLUMN_KEY } from './decorators';
import type { KeyOfType } from './types';

declare global {
  interface Array<T> {
    getByLanguage(
      this: CreateTranslationDto[],
      languageCode: LanguageCode,
    ): string;

    toPagination<DTO>(meta: PaginationMetaDto): PaginationResponseDto<DTO>;

    paginate<T>(query: PaginationRequestDto): PaginationResponseDto<T>;
  }
}

declare module 'typeorm' {
  interface SelectQueryBuilder<Entity> {
    searchByString(
      q: string,
      columnNames: string[],
      options?: {
        formStart: boolean;
      },
    ): this;

    paginate(
      this: SelectQueryBuilder<Entity>,
      paginationRequest: PaginationRequestDto,
      options?: Partial<{
        takeAll: boolean;
        skipCount: boolean;
        raw: boolean;
      }>,
    ): Promise<[Entity[], PaginationMetaDto]>;

    leftJoinAndSelect<AliasEntity extends AbstractEntity, A extends string>(
      this: SelectQueryBuilder<Entity>,
      property: `${A}.${Exclude<KeyOfType<AliasEntity, AbstractEntity>, symbol>}`,
      alias: string,
      condition?: string,
      parameters?: ObjectLiteral,
    ): this;

    leftJoin<AliasEntity extends AbstractEntity, A extends string>(
      this: SelectQueryBuilder<Entity>,
      property: `${A}.${Exclude<KeyOfType<AliasEntity, AbstractEntity>, symbol>}`,
      alias: string,
      condition?: string,
      parameters?: ObjectLiteral,
    ): this;

    innerJoinAndSelect<AliasEntity extends AbstractEntity, A extends string>(
      this: SelectQueryBuilder<Entity>,
      property: `${A}.${Exclude<KeyOfType<AliasEntity, AbstractEntity>, symbol>}`,
      alias: string,
      condition?: string,
      parameters?: ObjectLiteral,
    ): this;

    innerJoin<AliasEntity extends AbstractEntity, A extends string>(
      this: SelectQueryBuilder<Entity>,
      property: `${A}.${Exclude<KeyOfType<AliasEntity, AbstractEntity>, symbol>}`,
      alias: string,
      condition?: string,
      parameters?: ObjectLiteral,
    ): this;

    getRawManyToEntities(this: SelectQueryBuilder<Entity>): Promise<Entity[]>;

    getRawToEntity(this: SelectQueryBuilder<Entity>): Promise<Entity>;
  }
  interface Repository<Entity> {
    softRemoveAndSave(
      entityOrEntities: Entity | Entity[],
      options?: SaveOptions & {
        reload: false;
      },
    ): Promise<Entity>;
  }
}

Array.prototype.getByLanguage = function (languageCode: LanguageCode): string {
  return this.find((translation) => languageCode === translation.languageCode)!
    .text;
};

Array.prototype.toPagination = function <T>(
  meta: PaginationMetaDto,
): PaginationResponseDto<T> {
  return { data: this, ...meta };
};

Array.prototype.paginate = function <T>(
  query: PaginationRequestDto,
): PaginationResponseDto<T> {
  let array = this as T[];

  const isTakeAll = query.takeAll;
  if (!isTakeAll) {
    array = array.slice(query.skip, query.skip + query.pageSize);
  }

  const request: PaginationRequestDto = {
    ...query,
    pageIndex: isTakeAll ? 1 : query.pageIndex,
    pageSize: isTakeAll ? this.length : query.pageSize,
    get skip(): number {
      return (this.pageIndex - 1) * this.pageSize;
    },
  };

  const meta = new PaginationMetaDto({
    paginationRequest: request,
    total: this.length,
  });

  return array.toPagination<T>(meta);
};

SelectQueryBuilder.prototype.paginate = async function (
  paginationRequest: PaginationRequestDto,
  options?: Partial<{
    skipCount: boolean;
    takeAll: boolean;
    raw: boolean;
  }>,
) {
  const isTakeAll = options?.takeAll || paginationRequest.takeAll;
  if (!isTakeAll) {
    this.skip(paginationRequest.skip).take(paginationRequest.pageSize);
  }

  const entities = options?.raw
    ? await this.getRawManyToEntities()
    : await this.getMany();

  let total = -1;

  if (!options?.skipCount) {
    total = await this.getCount();
  }

  const request: PaginationRequestDto = {
    ...paginationRequest,
    pageIndex: isTakeAll ? 1 : paginationRequest.pageIndex,
    pageSize: isTakeAll ? total : paginationRequest.pageSize,
    get skip(): number {
      return (this.pageIndex - 1) * this.pageSize;
    },
  };

  const pageMetaDto = new PaginationMetaDto({
    total,
    paginationRequest: request,
  });

  return [entities, pageMetaDto];
};

SelectQueryBuilder.prototype.getRawManyToEntities = async function () {
  const { entities, raw } = await this.getRawAndEntities();

  const items = (entities || []).map((entity, index) => {
    const metaInfo = Reflect.getMetadata(VIRTUAL_COLUMN_KEY, entity) ?? {};
    const item = raw[index];

    for (const [propertyKey, name] of Object.entries<string>(metaInfo)) {
      entity[propertyKey] = item[name];
    }

    return entity;
  });

  return [...items];
};

SelectQueryBuilder.prototype.getRawToEntity = async function () {
  const { entities, raw } = await this.take(1).getRawAndEntities();
  if (!entities?.length) return null;

  const metaInfo = Reflect.getMetadata(VIRTUAL_COLUMN_KEY, entities[0]) ?? {};

  for (const [propertyKey, name] of Object.entries<string>(metaInfo)) {
    entities[0][propertyKey] = raw[0][name];
  }

  return entities[0];
};

Repository.prototype.softRemoveAndSave = async function <Entity>(
  entityOrEntities: Entity | Entity[],
  options?: SaveOptions & {
    reload: false;
  },
): Promise<Entity | Entity[]> {
  return this.manager.transaction(async (em) => {
    await em.softRemove(entityOrEntities, options);
    await em.save(entityOrEntities, options);

    return entityOrEntities;
  });
};

process.env.TZ = 'UTC';
