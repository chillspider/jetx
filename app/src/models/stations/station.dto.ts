import { AbstractDto } from '../commons/abstract.dto';
import { DeviceDto } from '../devices/device.dto';
import { StationLocationDto } from './station-location.dto';
import { StationStatus } from './station-status.enum';
import { StationTagDto } from './station-tag.dto';

export class StationDto extends AbstractDto {
	name!: string;

	description?: string;

	status?: StationStatus;

	featureImageUrl?: string;

	images?: string[];

	tags?: StationTagDto[];

	location!: StationLocationDto;

	distance?: number;

	devices?: DeviceDto[];

	deviceCount?: number;

	deviceReadyCount?: number;
}
