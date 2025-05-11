import { ClientType } from '../../yigoli/enums/client-type.enum';

export class OrderMetaData {
  // Station
  stationId?: string;
  stationName?: string;
  stationAddress?: string;

  // Vehicle
  vehicleId?: string;
  vehicleName?: string;
  vehicleNumberPlate?: string;

  // Status
  startTime?: Date;
  estEndTime?: Date;
  endTime?: Date;

  // YGL Info
  clientType?: ClientType;

  // FNB
  shopId?: string;

  // For package order
  packageId?: string;
  packageSku?: string;
  packageName?: string;
}
