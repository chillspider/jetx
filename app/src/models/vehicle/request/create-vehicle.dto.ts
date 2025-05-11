import { PickerImage } from '@/components/image-picker/image-picker';

export class CreateVehicleDto {
	brand?: string;

	model?: string;

	numberPlate!: string;

	seatCount!: number;

	color?: string;

	isDefault!: boolean;

	featureImage?: PickerImage;
}
