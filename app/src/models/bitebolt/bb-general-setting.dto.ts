/* eslint-disable max-classes-per-file */
import { BBApplicationCodeEnum } from './enums/bb.enum';

export class BBApplicationsStatusResponseDto {
	applicationCode!: BBApplicationCodeEnum;

	isActive!: boolean;
}

export class BBGeneralSettingDto {
	code?: string;

	branchName!: string;

	registrationDate!: Date;

	tax!: number;

	isPriceIncludedTax!: boolean;

	active?: boolean;

	subDomain!: string;

	tenantId!: string;

	applicationsStatus?: BBApplicationsStatusResponseDto[];
}
