import { AttentionDto } from '../attention/attention.dto';
import { AbstractDto } from '../commons/abstract.dto';
import { ProductDto } from '../product/product.dto';
import { DeviceConfigDto } from './device-config.dto';
import { DeviceMetadata } from './device-metadata.dto';
import { DeviceStatusEnum } from './device-status.enum';
import { ModeDto } from './mode.dto';

export class DeviceDto extends AbstractDto {
	name!: string;

	status!: DeviceStatusEnum;

	configs?: DeviceConfigDto;

	price!: number;

	metadata?: DeviceMetadata;

	stationId!: string;

	productId!: string;

	product!: ProductDto;

	modes?: ModeDto[];

	attentions?: AttentionDto[];
}
