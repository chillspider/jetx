import { DeviceDto } from "../device.dto";
import { KioskDto } from "../kiosk.dto";
import { StationDto } from "../station.dto";

export class KioskProfileDto {
	kiosk: KioskDto;
	device: DeviceDto;
	station: StationDto;
}
