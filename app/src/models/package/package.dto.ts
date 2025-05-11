export enum PackageStatus {
	DRAFT = 'draft',
	PUBLISH = 'publish',
	SUSPENDED = 'suspended',
}

export class PackageVoucherDto {
	name!: string;

	value!: number;

	quantity!: number;
}

export class PackageDto {
	guid!: string;

	sku!: string;

	name!: string;

	price!: number;

	targets?: string[];

	details?: string;

	status!: PackageStatus;

	stationIds?: string[];

	vouchers?: PackageVoucherDto[];
}
