import { InvoicePackageDto } from '../../package/dtos/package.dto';
import { IAlarmItem, WashStatus } from '../../webhook/dtos/yigoli-webhook.dto';
import { WashMode } from '../../yigoli/enums/wash-mode.enum';

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
  estEndTime?: Date;
  endTime?: Date;

  // Alarm
  alarmList?: IAlarmItem[];

  // Package
  packageInvoiceInfo?: InvoicePackageDto[];

  // Photo
  photo?: string;
}
