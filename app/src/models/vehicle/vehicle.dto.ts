import { AbstractDto } from '../commons/abstract.dto';

export class VehicleDto extends AbstractDto {
	userId!: string;

	brand?: string;

	model?: string;

	numberPlate!: string;

	seatCount!: number;

	color?: string;

	featureImageUrl?: string;

	isDefault!: boolean;
}
