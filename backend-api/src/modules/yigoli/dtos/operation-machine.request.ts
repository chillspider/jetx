import { ClientType } from '../enums/client-type.enum';
import { OperationType } from '../enums/operation-type.enum';
import { WashMode } from '../enums/wash-mode.enum';

export class OperationMachineRequest {
  operationType!: OperationType;
  factoryNo!: string;
  deviceNo!: string;
  orderNo!: string;
  washMode!: WashMode;
  mobile!: string;
  userId?: string;
  licencePlate?: string;
  orderTitle?: string;
  createTime?: string;
  lat?: string;
  lng?: string;
  orderAmount: number;
  deductAmount: number;
  orderActualAmount: number;
  clientType?: ClientType;
}

export class OperationMachine {
  operationType!: OperationType;
  factoryNo?: string;
  deviceNo!: string;
  clientType!: number;
  clientId!: number;
  orderNo!: string;
  washMode!: WashMode;
  source!: string;
  mobile!: string;
  userId?: string;
  licencePlate?: string;
  payType!: number;
  couponType?: number;
  orderTitle?: string;
  orderAmount!: number;
  orderActualAmount!: number;
  deductAmount!: number;
  currencyCode!: string;
  currencySymbol!: string;
  createTime?: string;
  lat?: string;
  lng?: string;
  isThird?: boolean;
}
