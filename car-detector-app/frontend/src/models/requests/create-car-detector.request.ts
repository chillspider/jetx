import { CarModelDto } from "../car-model.dto";

export class CreateCarDetectorRequest {
	orderId!: string;
	deviceId?: string;
	customerId?: string;
	car!: CarModelDto;
}
