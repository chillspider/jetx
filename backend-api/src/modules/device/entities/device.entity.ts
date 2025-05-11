import { AutoMap } from '@automapper/classes';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';

import { AbstractEntity } from '../../../common/entities/abstract.entity';
import { GPayQRInfo } from '../../payment/dtos/gpay/gpay-qr-response';
import { ProductEntity } from '../../product/entities/product.entity';
import { StationEntity } from '../../station/entities/station.entity';
import { DeviceStatusEnum } from '../enums/device-status.enum';
import { DeviceAttentionEntity } from './device-attention.entity';

@Entity({ name: 'devices', synchronize: false })
export class DeviceEntity extends AbstractEntity {
  @Column()
  @AutoMap()
  name!: string;

  @Column({ default: DeviceStatusEnum.AVAILABLE })
  @AutoMap()
  status!: DeviceStatusEnum;

  @Column({ type: 'uuid' })
  @AutoMap()
  stationId!: string;

  @Column({ type: 'uuid' })
  @AutoMap()
  productId!: string;

  @Column({ nullable: true })
  @AutoMap()
  deviceNo?: string;

  @Column({ nullable: true, type: 'jsonb' })
  @AutoMap()
  qr?: GPayQRInfo;

  @ManyToOne(() => StationEntity, (e) => e.devices, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'station_id' })
  @AutoMap(() => StationEntity)
  station?: StationEntity;

  @ManyToOne(() => ProductEntity, (e) => e.devices, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'product_id' })
  @AutoMap(() => ProductEntity)
  product?: ProductEntity;

  @OneToMany(
    () => DeviceAttentionEntity,
    (e: DeviceAttentionEntity) => e.device,
    { cascade: true },
  )
  @AutoMap(() => [DeviceAttentionEntity])
  deviceAttentions?: DeviceAttentionEntity[];
}
