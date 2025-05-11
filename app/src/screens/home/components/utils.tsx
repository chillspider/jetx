import { StationLocationDto } from '@/models/stations/station-location.dto';
import colors from '@/theme/colors';

export type TagColor = {
	backgroundColor: string;
	textColor: string;
};

const tagColors: TagColor[] = [
	{ backgroundColor: colors.yellow2, textColor: colors.yellow },
	{ backgroundColor: colors.green2, textColor: colors.green },
	{ backgroundColor: colors.blue2, textColor: colors.blue },
	{ backgroundColor: colors.red2, textColor: colors.red },
];

export const getRandomTagColor = () => {
	const randomIndex = Math.floor(Math.random() * tagColors.length);
	return tagColors[randomIndex];
};

export const getTagColorByIndex = (index: number) => {
	const colorIndex = index % tagColors.length;

	return tagColors[colorIndex];
};

export function formatDistance(distanceInKm: number): string {
	if (distanceInKm < 1) {
		const distanceInMeters = distanceInKm * 1000;
		return `${distanceInMeters.toFixed(0)} m`;
	}
	return `${distanceInKm.toFixed(2)} km`;
}

export function getFormattedAddress(location: StationLocationDto): string {
	let formattedAddress = location.address;

	if (location.ward) {
		formattedAddress += `, ${location.ward}`;
	}

	if (location.district) {
		formattedAddress += `, ${location.district}`;
	}

	if (location.city) {
		formattedAddress += `, ${location.city}`;
	}

	return formattedAddress;
}
