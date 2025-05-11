import { AbstractDto } from "./abstract.dto";
import { DeviceDto } from "./device.dto";

export enum StationStatus {
	ACTIVE = "active",
	INACTIVE = "inactive",
	MAINTENANCE = "maintenance",
}

export class StationTagDto {
	name!: string;
	color?: string;
}

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

export class StationMetadataDto {
	shopId?: string;
}

export class StationDto extends AbstractDto {
	name!: string;
	description?: string;
	status?: StationStatus;
	featureImageUrl?: string;
	images?: string[];
	tags?: StationTagDto[];
	location!: StationLocationDto;
	distance?: number;
	data?: StationMetadataDto;
	devices?: DeviceDto[];
	deviceCount?: number;
	deviceReadyCount?: number;
}
