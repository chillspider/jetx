import { OrderDto } from "./order.dto";

export enum NotificationType {
	ORDER = "order",
}

export interface OrderEventDto {
	data: {
		type: NotificationType;
		data: OrderDto;
	};
}
