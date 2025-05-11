import { AbstractDto } from "./abstract.dto";

export enum KioskStatusEnum {
	ACTIVE = "active",
	OFFLINE = "offline",
	PENDING = "pending",
}

export class KioskDto extends AbstractDto {
	name?: string;
	status: KioskStatusEnum;
	stationId: string;
	deviceId?: string;
	lastOnline?: Date;
	userId: string;
}
