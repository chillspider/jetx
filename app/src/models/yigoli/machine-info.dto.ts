import { MachineAllowStatus } from './allow-status.enum';
import { MachineAllowType } from './allow-type.enum';

export class MachineInfoDto {
	isAllow!: MachineAllowStatus;

	notAllowType?: MachineAllowType;

	notAllowDesc?: string;

	factoryNo?: string;

	factoryName?: string;
}
