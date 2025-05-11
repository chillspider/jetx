import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import isBetween from 'dayjs/plugin/isBetween';
import utc from 'dayjs/plugin/utc';

import settingApi from '@/services/setting/setting-services';

dayjs.extend(utc);
dayjs.extend(duration);
dayjs.extend(isBetween);

export const timeNow = dayjs.utc();

export const getServerTime = async (): Promise<dayjs.Dayjs> => {
	try {
		const res = await settingApi.getServerTime();
		return dayjs.utc(res.data);
	} catch {
		return timeNow;
	}
};

export const formatDate = (date: dayjs.ConfigType, format: string = 'DD/MM/YYYY'): string => {
	return dayjs(date).format(format);
};

export const calculateProgress = (startTime: Date, endTime: Date): number => {
	const currentTime = dayjs.utc();

	const start = dayjs.utc(startTime);
	const end = dayjs.utc(endTime);

	const totalDuration = end.diff(start, 'second');
	const elapsedTime = currentTime.diff(start, 'second');

	const progressPercentage = Math.min((elapsedTime / totalDuration) * 100, 100);
	return Math.round(progressPercentage);
};

export const calculateRemainingTime = (endTime: Date): string => {
	const currentTime = dayjs.utc();

	const end = dayjs.utc(endTime);

	const remainingSeconds = end.diff(currentTime, 'second');

	if (remainingSeconds <= 60) {
		return '';
	}

	const minutes = Math.floor(remainingSeconds / 60);

	return `${minutes} phút`;
};

export const calculateTimeLeftInSeconds = async (expiryDate: Date | string): Promise<number> => {
	const end = dayjs.utc(expiryDate);
	const now = await getServerTime();

	const timeLeft = Math.max(0, end.diff(now, 'second'));

	return timeLeft;
};

export const isTimeInRange = (
	start: dayjs.ConfigType,
	end: dayjs.ConfigType,
	currentTime: dayjs.ConfigType,
): boolean => {
	const startDayjs = dayjs.utc(start);
	const endDayjs = dayjs.utc(end);
	const currentTimeDayjs = dayjs.utc(currentTime);

	return currentTimeDayjs.isBetween(startDayjs, endDayjs, null, '[]');
};

export const timeDuration = (endAt: Date) => {
	const endAtDate = dayjs(endAt);
	if (!endAtDate.isValid()) {
		return null;
	}

	const now = dayjs();
	const diff = endAtDate.diff(now);

	if (diff <= 0) {
		return null;
	}

	const d = dayjs.duration(diff);

	return d;
};
