import { AutoMap } from '@automapper/classes';

import { AbstractDto } from '../../../common/dto/abstract.dto';
import {
  ClassField,
  ClassFieldOptional,
  EnumField,
  StringField,
} from '../../../decorators';
import { GPayQRInfo } from '../../payment/dtos/gpay/gpay-qr-response';
import { ModeDto } from '../../product/dtos/mode.dto';
import { ProductDto } from '../../product/dtos/product.dto';
import { DeviceStatusEnum } from '../enums/device-status.enum';
import { AttentionDto } from './attention.dto';

export class DeviceDto extends AbstractDto {
  @StringField()
  @AutoMap()
  name!: string;

  @EnumField(() => DeviceStatusEnum)
  @AutoMap()
  status!: DeviceStatusEnum;

  @StringField()
  @AutoMap()
  stationId!: string;

  @StringField()
  @AutoMap()
  productId!: string;

  @StringField()
  @AutoMap()
  deviceNo!: string;

  @ClassField(() => ProductDto)
  @AutoMap()
  product!: ProductDto;

  @ClassFieldOptional(() => AttentionDto, { isArray: true })
  @AutoMap(() => [AttentionDto])
  attentions?: AttentionDto[];

  @ClassField(() => GPayQRInfo)
  @AutoMap()
  qr?: GPayQRInfo;
}

export class DeviceAndModeDto extends DeviceDto {
  @ClassFieldOptional(() => ModeDto, { isArray: true })
  modes?: ModeDto[];
}
