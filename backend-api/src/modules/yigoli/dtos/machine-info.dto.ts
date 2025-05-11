import {
  EnumField,
  EnumFieldOptional,
  StringFieldOptional,
} from '../../../decorators';
import { MachineAllowStatus } from '../enums/allow-status.enum';
import { MachineAllowType } from '../enums/allow-type.enum';

export class MachineInfoDto {
  @EnumField(() => MachineAllowStatus)
  isAllow!: MachineAllowStatus;

  @EnumFieldOptional(() => MachineAllowType)
  notAllowType?: MachineAllowType;

  @StringFieldOptional()
  notAllowDesc?: string;

  @StringFieldOptional()
  factoryNo?: string;

  @StringFieldOptional()
  factoryName?: string;
}
