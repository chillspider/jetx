export enum WashStatus {
  START = 'START',
  COMPLETE = 'COMPLETE',
  ALARM = 'ALARM',
  STOP = 'STOP',
  REFUND = 'REFUND',
}

export enum AlarmType {
  FAULT = 1,
  WARNING = 2,
}

export interface IAlarmItem {
  alarmType: AlarmType;
  alarmCode: string;
  alarmName: string;
  alarmDesc: string;
  alarmReason: string;
}

export interface IYglWebhookData {
  yglOrderNo: string;
  orderNo: string; /// orderIncrementId;
  deviceNo: string;
  washStatus: WashStatus;
  alarmList: IAlarmItem[];
  timeStamp: string;
}
