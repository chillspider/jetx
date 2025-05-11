import { VoucherLocationDto } from './voucher.dto';
import { VoucherModelEnum, VoucherProfileApplicationEnum, VoucherTypeEnum } from './voucher.enum';

export class OrderVoucherDto {
	id!: string;

	name!: string;

	description?: string;

	type!: VoucherTypeEnum;

	profileApplication!: VoucherProfileApplicationEnum;

	voucherModel!: VoucherModelEnum;

	minOrderValue?: number;

	maxDeductionValue?: number;

	hiddenCashValue?: number;

	startAt?: Date;

	endAt?: Date;

	location!: VoucherLocationDto;
}
