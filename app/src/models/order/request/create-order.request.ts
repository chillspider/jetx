/* eslint-disable max-classes-per-file */
export class CreateOrderRequest {
	deviceId!: string;

	modeId!: string;

	voucherId?: string;

	note?: string;

	constructor(deviceId: string, modeId: string, voucherId?: string, note?: string) {
		this.deviceId = deviceId;
		this.modeId = modeId;
		this.voucherId = voucherId;
		this.note = note;
	}
}

export class UpdateOrderRequest extends CreateOrderRequest {
	id!: string;

	constructor(id: string, deviceId: string, modeId: string, voucherId?: string, note?: string) {
		super(deviceId, modeId, voucherId, note);
		this.id = id;
	}
}
