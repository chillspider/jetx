import { AbstractDto } from '../commons/abstract.dto';
import { ModeMetadata } from './mode-metadata.dto';

export class ModeDto extends AbstractDto {
	name!: string;

	description?: string;

	code!: string;

	price!: number;

	originPrice!: number;

	metadata?: ModeMetadata;

	deviceId!: string;
}
