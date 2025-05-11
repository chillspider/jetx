import { DeviceDto } from '../../device/dtos/device.dto';
import { DeviceStatusEnum } from '../../device/enums/device-status.enum';
import { StationDto } from '../dtos/station.dto';

export class StationUtils {
  public static buildStationDevice(
    station: StationDto,
    devices: DeviceDto[],
  ): StationDto {
    const { total, ready } = this.calculateDeviceStatus(devices);

    station.deviceCount = total;
    station.deviceReadyCount = ready;

    return station;
  }

  public static buildStationsDevices(
    stations: StationDto[],
    devices: DeviceDto[],
  ): StationDto[] {
    return stations.map((station) =>
      this.buildStationDevice(
        station,
        devices.filter((device) => device.stationId === station.id),
      ),
    );
  }

  public static calculateDeviceStatus(devices: DeviceDto[]): {
    total: number;
    ready: number;
  } {
    const { total, ready } = devices.reduce(
      (acc, device) => {
        if (device.status === DeviceStatusEnum.UNAVAILABLE) {
          return acc;
        }

        acc.total += 1;
        if (device.status === DeviceStatusEnum.AVAILABLE) {
          acc.ready += 1;
        }

        return acc;
      },
      { total: 0, ready: 0 },
    );

    return {
      total,
      ready,
    };
  }
}
