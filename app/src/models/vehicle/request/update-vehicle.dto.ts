import { CreateVehicleDto } from './create-vehicle.dto';

export class UpdateVehicleDto extends CreateVehicleDto {
	id!: string;

	featureImageUrl?: string;
}
