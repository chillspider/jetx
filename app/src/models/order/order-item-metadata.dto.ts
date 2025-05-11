import { WashMode } from '../yigoli/wash-mode.enum';
import { WashStatus } from '../yigoli/yigoli-webhook.dto';

export class OrderItemMetaData {
	// Mode
	mode?: WashMode;

	modeId?: string;

	modeName?: string;

	// Device
	deviceId?: string;

	deviceNo?: string;

	deviceName?: string;

	// Station
	stationId?: string;

	stationName?: string;

	stationAddress?: string;

	lat?: number;

	lng?: number;

	// Wash status
	washStatus?: WashStatus;

	startTime?: Date;

	completeTime?: Date;
}
