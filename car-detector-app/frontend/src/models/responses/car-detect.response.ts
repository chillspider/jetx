export class CarDetectDto {
	brand?: string;
	car_type?: string;
	color?: string;
	plate_number?: string;
}

export class CarDetectResponse {
	cars?: CarDetectDto[];
}
