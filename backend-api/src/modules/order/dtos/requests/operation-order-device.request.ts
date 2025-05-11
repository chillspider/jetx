import { EnumField, StringField } from '../../../../decorators';
import { OperationType } from '../../../yigoli/enums/operation-type.enum';

export class OperationOrderDeviceRequest {
  @StringField()
  orderId: string;

  @StringField()
  deviceId: string;

  @EnumField(() => OperationType)
  operation: OperationType;
}
