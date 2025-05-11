import { DeviceDto } from "../device.dto";
import { StationDto } from "../station.dto";
import { LoginResponse } from "./login.response";

export class KioskClientProfileResponse extends LoginResponse {
	device: DeviceDto;
	station: StationDto;
}
