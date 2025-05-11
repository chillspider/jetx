import { AbstractDto } from '../commons/abstract.dto';

export class StationLocationDto extends AbstractDto {
	stationId!: string;

	city!: string;

	cityId!: string;

	district!: string;

	districtId!: string;

	ward!: string;

	wardId!: string;

	address!: string;

	latitude!: number;

	longitude!: number;
}
