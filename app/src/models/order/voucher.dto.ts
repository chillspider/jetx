/* eslint-disable max-classes-per-file */

import { isNil } from 'ramda';

import { isTimeInRange } from '@/utils/date-utils';

import { AbstractDto } from '../commons/abstract.dto';
import { WashMode } from '../yigoli/wash-mode.enum';
import {
	VoucherModelEnum,
	VoucherProfileApplicationEnum,
	VoucherStatusEnum,
	VoucherTypeEnum,
} from './voucher.enum';

export class EventValidityDto {
	guid!: string;

	name?: string;

	description?: string;

	start!: Date;

	end!: Date;
}

export class VoucherValidityDto {
	excludeTimes: EventValidityDto[] = [];
	washModes: WashMode[] = [];
}

export class VoucherLocationDto {
	stationIds: string[] = [];

	deviceIds: string[] = [];

	isExcluded: boolean = false;
}

export class VoucherDto extends AbstractDto {
	name!: string;

	description?: string;

	type!: VoucherTypeEnum;

	profileApplication!: VoucherProfileApplicationEnum;

	voucherModel!: VoucherModelEnum;

	minOrderValue!: number;

	maxDeductionValue?: number;

	hiddenCashValue!: number;

	percentage?: number;

	startAt?: Date;

	endAt?: Date;

	location!: VoucherLocationDto;

	status!: VoucherStatusEnum;

	orderId?: string;

	userId?: string;

	validity?: VoucherValidityDto;
}

export const isVoucherLocationEnabled = (
	voucher: VoucherDto,
	deviceId: string,
	stationId: string,
): boolean => {
	const {
		location: { deviceIds, stationIds, isExcluded },
	} = voucher;

	if (deviceIds.length === 0 && stationIds.length === 0) return true;

	if (isExcluded) {
		return !(deviceIds.includes(deviceId) || stationIds.includes(stationId));
	}

	const isDeviceIncluded = deviceIds.length === 0 || deviceIds.includes(deviceId);
	const isStationIncluded = stationIds.length === 0 || stationIds.includes(stationId);

	return isDeviceIncluded && isStationIncluded;
};

export const isVoucherValidityEnabled = (
	voucher: VoucherDto,
	currentTime: Date,
	washMode: WashMode,
): boolean => {
	const { validity } = voucher;

	if (isNil(validity)) {
		return true;
	}

	const { excludeTimes = [], washModes = [] } = validity;

	const isInRange = excludeTimes.some(event => {
		const { start, end } = event;

		return isTimeInRange(start, end, currentTime);
	});

	if (isInRange) return false;

	const isWashModeIncluded = washModes.length === 0 || washModes.includes(washMode);

	return isWashModeIncluded;
};

export const isVoucherEnabled = (
	voucher: VoucherDto,
	currentTime: Date,
	deviceId: string,
	stationId: string,
	washMode: WashMode,
): boolean => {
	return (
		isVoucherLocationEnabled(voucher, deviceId, stationId) &&
		isVoucherValidityEnabled(voucher, currentTime, washMode)
	);
};
