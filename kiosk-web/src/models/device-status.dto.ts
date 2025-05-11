export enum MachineAllowStatus {
	NOT_ALLOW = 0,
	ALLOW = 1,
}

export enum MachineAllowType {
	OFFLINE = 1,
	FAULT = 2,
	MOVE_FORWARD = 3,
	MOVE_BACKWARD = 4,
	BODY_NOT_STRAIGHT = 5,
	WASHING = 6,
	MAINTAIN = 7,
	STOP = 10,
	UNKNOWN = 11,
}

export class DeviceStatusDto {
	isAllow!: MachineAllowStatus;
	notAllowType?: MachineAllowType;
	notAllowDesc?: string;
	factoryNo?: string;
	factoryName?: string;
}

export const DeviceNotAllowStatus = {
	[MachineAllowType.OFFLINE]: "Máy đang offline",
	[MachineAllowType.FAULT]: "Máy đang bị lỗi",
	[MachineAllowType.MOVE_FORWARD]: "Vui lòng tiến xe về phía trước",
	[MachineAllowType.MOVE_BACKWARD]: "Vui lòng lùi xe về phía sau",
	[MachineAllowType.BODY_NOT_STRAIGHT]: "Xe không đúng vị trí",
	[MachineAllowType.WASHING]: "Máy đang rửa",
	[MachineAllowType.MAINTAIN]: "Máy đang bảo trì",
	[MachineAllowType.STOP]: "Máy đang dừng",
	[MachineAllowType.UNKNOWN]: "Máy đang gặp sự cố",
};
