import { ClientType } from '../enums/client-type.enum';
import { YglOrderStatus } from '../enums/ygl-order-status.enum';

export class YglOrderDto {
  orderId: string;
  orderNo!: string;
  orderTitle!: string;
  orderStatus!: YglOrderStatus | number;
  factoryNo: string;
  factoryName: string;
  userId: string;
  mobile: string;
  clientType: ClientType;
  serviceStartTime: Date;
  serviceEndTime: Date;
  extParam: string;
  createDate: Date;
  plateNumber: string;
  washCarBeforePic: string;
  washCarAfterPic: string;
  currencyCode: string;
  currencySymbol: string;
}
