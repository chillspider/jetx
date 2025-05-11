import { AutoMap } from '@automapper/classes';
import {
  BeforeSoftRemove,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';

import { AbstractEntity } from '../../../common/entities/abstract.entity';
import { markAsDeleted } from '../../../common/utils';
import { DeviceEntity } from '../../device/entities/device.entity';
import { ProductStatusEnum, ProductTypeEnum } from '../enums/products.enum';
import { CategoryEntity } from './category.entity';

@Entity({ name: 'products', synchronize: false })
export class ProductEntity extends AbstractEntity {
  @Column()
  @AutoMap()
  name!: string;

  @Column({ nullable: true })
  @AutoMap()
  description?: string;

  @Column({ unique: true, nullable: true })
  @AutoMap()
  sku?: string;

  @Column({ default: ProductStatusEnum.VISIBLE })
  @AutoMap()
  status!: ProductStatusEnum;

  @Column({ default: ProductTypeEnum.WASHING })
  @AutoMap()
  type!: ProductTypeEnum;

  @Column({ nullable: true })
  @AutoMap()
  featureImageUrl?: string;

  @Column({ name: 'category_id', nullable: true })
  @AutoMap(() => String)
  categoryId?: string;

  @ManyToOne(
    () => CategoryEntity,
    (category: CategoryEntity) => category.products,
    {
      onDelete: 'SET NULL',
    },
  )
  @JoinColumn({ name: 'category_id' })
  @AutoMap()
  category?: CategoryEntity;

  @OneToMany(() => DeviceEntity, (category: DeviceEntity) => category.product)
  devices?: DeviceEntity[];

  @BeforeSoftRemove()
  markSkuAsDeleted() {
    this.sku = markAsDeleted(this.sku);
  }
}
