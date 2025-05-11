import {
  createMap,
  forMember,
  mapFrom,
  Mapper,
  MappingProfile,
} from '@automapper/core';
import { AutomapperProfile, InjectMapper } from '@automapper/nestjs';
import { Injectable } from '@nestjs/common';

import { ModeAndProductDto, ModeDto } from '../dtos/mode.dto';
import { ProductDto } from '../dtos/product.dto';
import { CreateModeDto, UpdateModeDto } from '../dtos/requests/create-mode-dto';
import {
  CreateProductDto,
  UpdateProductDto,
} from '../dtos/requests/create-product.dto';
import { ModeEntity } from '../entities/mode.entity';
import { ProductEntity } from '../entities/product.entity';

@Injectable()
export class ProductProfile extends AutomapperProfile {
  constructor(@InjectMapper() mapper: Mapper) {
    super(mapper);
  }

  get profile(): MappingProfile {
    return (mapper) => {
      createMap(mapper, ProductEntity, ProductDto);
      createMap(mapper, ProductDto, ProductEntity);
      createMap(mapper, CreateProductDto, ProductEntity);
      createMap(mapper, UpdateProductDto, ProductEntity);
      createMap(
        mapper,
        ModeEntity,
        ModeDto,
        forMember(
          (d) => d.originPrice,
          mapFrom((s) => s.price),
        ),
      );
      createMap(mapper, ModeDto, ModeEntity);
      createMap(mapper, CreateModeDto, ModeEntity);
      createMap(mapper, UpdateModeDto, ModeEntity);
      createMap(mapper, ModeEntity, ModeAndProductDto);
    };
  }
}
