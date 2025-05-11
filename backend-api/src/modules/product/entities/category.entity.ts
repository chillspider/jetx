import { AutoMap } from '@automapper/classes';
import { Column, Entity, OneToMany } from 'typeorm';

import { AbstractEntity } from '../../../common/entities/abstract.entity';
import { CategoryStatusEnum } from '../enums/categories.enum';
import { ProductEntity } from './product.entity';

@Entity({ name: 'categories', synchronize: false })
export class CategoryEntity extends AbstractEntity {
  @Column()
  @AutoMap()
  name!: string;

  @Column({ nullable: true })
  @AutoMap()
  description?: string;

  @Column({ default: CategoryStatusEnum.VISIBLE })
  @AutoMap()
  status!: CategoryStatusEnum;

  @Column({ default: 0 })
  @AutoMap()
  priority!: number;

  @OneToMany(() => ProductEntity, (product: ProductEntity) => product.category)
  @AutoMap(() => [ProductEntity])
  products?: ProductEntity[];
}
