import { createMap, Mapper, MappingProfile } from '@automapper/core';
import { AutomapperProfile, InjectMapper } from '@automapper/nestjs';
import { Injectable } from '@nestjs/common';

import { CategoryDto } from '../dtos/category.dto';
import {
  CreateCategoryDto,
  UpdateCategoryDto,
} from '../dtos/requests/create-category.dto';
import { CategoryEntity } from '../entities/category.entity';

@Injectable()
export class CategoryProfile extends AutomapperProfile {
  constructor(@InjectMapper() mapper: Mapper) {
    super(mapper);
  }

  get profile(): MappingProfile {
    return (mapper) => {
      createMap(mapper, CategoryEntity, CategoryDto);
      createMap(mapper, CategoryDto, CategoryEntity);
      createMap(mapper, CreateCategoryDto, CategoryEntity);
      createMap(mapper, UpdateCategoryDto, CategoryEntity);
    };
  }
}
