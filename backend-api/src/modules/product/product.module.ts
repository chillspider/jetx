import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SharedModule } from '../../shared/shared.module';
import { CategoryController } from './controllers/category.controller';
import { ModeController } from './controllers/mode.controller';
import { ProductController } from './controllers/product.controller';
import { CategoryEntity } from './entities/category.entity';
import { ModeEntity } from './entities/mode.entity';
import { ProductEntity } from './entities/product.entity';
import { CategoryProfile } from './profiles/category.profile';
import { ProductProfile } from './profiles/product.profile';
import { CategoryService } from './services/category.service';
import { ModeService } from './services/mode.service';
import { ProductService } from './services/product.service';

const providers = [
  ProductService,
  ProductProfile,
  CategoryService,
  CategoryProfile,
  ModeService,
];

@Module({
  imports: [
    SharedModule,
    TypeOrmModule.forFeature([ProductEntity, CategoryEntity, ModeEntity]),
  ],
  controllers: [ProductController, CategoryController, ModeController],
  exports: providers,
  providers: providers,
})
export class ProductModule {}
