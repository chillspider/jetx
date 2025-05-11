import { OperationType } from '@/models/yigoli/operation-type.enum';

export class OperationOrderDeviceRequest {
	orderId: string;

	deviceId: string;

	operation: OperationType;

	constructor(orderId: string, deviceId: string, operation: OperationType) {
		this.deviceId = deviceId;
		this.orderId = orderId;
		this.operation = operation;
	}
}
