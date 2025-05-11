/* eslint-disable simple-import-sort/imports */
import { makeStyles, Text, useTheme } from '@rneui/themed';
import React, { useMemo } from 'react';
import { View } from 'react-native';
import { Path, Svg } from 'react-native-svg';

import { Box } from '@/components';
import { OrderStatusEnum } from '@/models/order/order-status.enum';
import { OrderDto } from '@/models/order/order.dto';
import { formatDate } from '@/utils/date-utils';
import { displayPrice } from '@/utils/format';
import { useTranslation } from 'react-i18next';

type Props = {
	data: OrderDto;
	index: number;
};

const HistoryItem: React.FC<Props> = ({ data, index }) => {
	const {
		theme: { colors },
	} = useTheme();

	const styles = useStyles({ index });

	const { t } = useTranslation();

	const statusValue = useMemo(() => {
		switch (data.status) {
			case OrderStatusEnum.PENDING:
				return t('orderStatus.pending');
			case OrderStatusEnum.PROCESSING:
				return t('orderStatus.processing');
			case OrderStatusEnum.COMPLETED:
				return t('orderStatus.completed');
			case OrderStatusEnum.CANCELED:
				return t('orderStatus.canceled');
			case OrderStatusEnum.FAILED:
				return t('orderStatus.failed');
			case OrderStatusEnum.REFUNDED:
				return t('orderStatus.refunded');
			case OrderStatusEnum.ABNORMAL_STOP:
				return t('orderStatus.abnormal_stop');
			case OrderStatusEnum.SELF_STOP:
				return t('orderStatus.self_stop');
			default:
				return '';
		}
	}, [data.status, t]);

	const statusColor = useMemo(() => {
		switch (data.status) {
			case OrderStatusEnum.PENDING:
				return colors.yellow;
			case OrderStatusEnum.PROCESSING:
				return colors.green;
			case OrderStatusEnum.COMPLETED:
				return colors.blue;
			default:
				return colors.red;
		}
	}, [colors, data.status]);

	return (
		<View style={styles.container}>
			<IconLocation />
			<Box flex={1} px={8}>
				<Text>{data.data?.stationName || ''}</Text>
				<Box pt={4} flexDirection="row" alignItems="center">
					<AddressIcon />
					<Text numberOfLines={1} style={styles.address}>
						{data.data?.stationAddress || ''}
					</Text>
				</Box>
				<Box pt={4} flexDirection="row" alignItems="center">
					<DateTimeIcon />
					<Text numberOfLines={1} style={styles.address}>
						{formatDate(data.createdAt || Date.now())}
					</Text>
					<Box backgroundColor={statusColor} width={4} height={4} borderRadius={2} mx={4} />
					<Text numberOfLines={1} style={[styles.status, { color: statusColor }]}>
						{statusValue}
					</Text>
				</Box>
			</Box>
			<Text style={styles.price}>-{displayPrice(data.grandTotal || 0)}</Text>
		</View>
	);
};

const AddressIcon = () => {
	return (
		<Svg width="12" height="12" viewBox="0 0 12 12" fill="none">
			<Path
				d="M6 0.5C3.52074 0.5 1.5 2.52074 1.5 5C1.5 6.74744 2.60427 8.19558 3.65137 9.21191C4.69846 10.2282 5.74609 10.8428 5.74609 10.8428C5.82303 10.8881 5.9107 10.912 6 10.912C6.0893 10.912 6.17697 10.8881 6.25391 10.8428C6.25391 10.8428 7.30154 10.2282 8.34863 9.21191C9.39573 8.19558 10.5 6.74744 10.5 5C10.5 2.52074 8.47926 0.5 6 0.5ZM6 1.5C7.93874 1.5 9.5 3.06126 9.5 5C9.5 6.31156 8.60427 7.56923 7.65137 8.49414C6.82546 9.29579 6.20537 9.65648 6 9.7832C5.79463 9.65648 5.17454 9.29579 4.34863 8.49414C3.39573 7.56923 2.5 6.31156 2.5 5C2.5 3.06126 4.06126 1.5 6 1.5ZM6 3C5.375 3 4.84261 3.25238 4.50098 3.63672C4.15934 4.02106 4 4.51389 4 5C4 5.48611 4.15934 5.97894 4.50098 6.36328C4.84261 6.74762 5.375 7 6 7C6.625 7 7.15739 6.74762 7.49902 6.36328C7.84066 5.97894 8 5.48611 8 5C8 4.51389 7.84066 4.02106 7.49902 3.63672C7.15739 3.25238 6.625 3 6 3ZM6 4C6.375 4 6.59261 4.12262 6.75098 4.30078C6.90934 4.47894 7 4.73611 7 5C7 5.26389 6.90934 5.52106 6.75098 5.69922C6.59261 5.87738 6.375 6 6 6C5.625 6 5.40739 5.87738 5.24902 5.69922C5.09066 5.52106 5 5.26389 5 5C5 4.73611 5.09066 4.47894 5.24902 4.30078C5.40739 4.12262 5.625 4 6 4Z"
				fill="#A0A0A1"
			/>
		</Svg>
	);
};

const DateTimeIcon = () => {
	return (
		<Svg width="12" height="12" viewBox="0 0 12 12" fill="none">
			<Path
				d="M3.99219 0.993164C3.85975 0.995234 3.73354 1.04976 3.64127 1.14479C3.54899 1.23981 3.49819 1.36756 3.5 1.5H2C1.8674 1.50001 1.74023 1.5527 1.64646 1.64646C1.5527 1.74023 1.50001 1.8674 1.5 2V10C1.50001 10.1326 1.5527 10.2598 1.64646 10.3535C1.74023 10.4473 1.8674 10.5 2 10.5H10C10.1326 10.5 10.2598 10.4473 10.3535 10.3535C10.4473 10.2598 10.5 10.1326 10.5 10V2C10.5 1.8674 10.4473 1.74023 10.3535 1.64646C10.2598 1.5527 10.1326 1.50001 10 1.5H8.5C8.50092 1.43311 8.4884 1.36671 8.46319 1.30474C8.43798 1.24277 8.4006 1.18648 8.35324 1.13922C8.30589 1.09196 8.24954 1.05469 8.18752 1.0296C8.1255 1.00451 8.05908 0.992119 7.99219 0.993164C7.85975 0.995234 7.73354 1.04976 7.64127 1.14479C7.54899 1.23981 7.49819 1.36756 7.5 1.5H4.5C4.50092 1.43311 4.4884 1.36671 4.46319 1.30474C4.43798 1.24277 4.4006 1.18648 4.35325 1.13922C4.30589 1.09196 4.24954 1.05469 4.18752 1.0296C4.1255 1.00451 4.05908 0.992119 3.99219 0.993164ZM2.5 2.5H3.5C3.49906 2.56626 3.5113 2.63204 3.53601 2.69352C3.56072 2.75501 3.5974 2.81097 3.64392 2.85815C3.69044 2.90534 3.74588 2.9428 3.80701 2.96838C3.86814 2.99395 3.93374 3.00712 4 3.00712C4.06626 3.00712 4.13186 2.99395 4.19299 2.96838C4.25412 2.9428 4.30956 2.90534 4.35608 2.85815C4.4026 2.81097 4.43928 2.75501 4.46399 2.69352C4.4887 2.63204 4.50094 2.56626 4.5 2.5H7.5C7.49906 2.56626 7.5113 2.63204 7.53601 2.69352C7.56072 2.75501 7.5974 2.81097 7.64392 2.85815C7.69044 2.90534 7.74588 2.9428 7.80701 2.96838C7.86814 2.99395 7.93374 3.00712 8 3.00712C8.06626 3.00712 8.13186 2.99395 8.19299 2.96838C8.25412 2.9428 8.30956 2.90534 8.35608 2.85815C8.4026 2.81097 8.43928 2.75501 8.46399 2.69352C8.4887 2.63204 8.50094 2.56626 8.5 2.5H9.5V4H2.5V2.5ZM2.5 5H9.5V9.5H2.5V5Z"
				fill="#A0A0A1"
			/>
		</Svg>
	);
};

const IconLocation = () => {
	return (
		<Svg width="20" height="20" viewBox="0 0 20 20" fill="none">
			<Path
				opacity="0.35"
				d="M3.3335 8.33335C3.3335 4.65169 6.3185 1.66669 10.0002 1.66669C13.6818 1.66669 16.6668 4.65169 16.6668 8.33335C16.6668 11.3034 13.2802 15.5434 11.3343 17.7334C10.6252 18.5317 9.37516 18.5317 8.666 17.7334C6.72016 15.5434 3.3335 11.3034 3.3335 8.33335Z"
				fill="#292A2B"
			/>
			<Path
				d="M10 10.8333C11.3807 10.8333 12.5 9.71402 12.5 8.33331C12.5 6.9526 11.3807 5.83331 10 5.83331C8.61929 5.83331 7.5 6.9526 7.5 8.33331C7.5 9.71402 8.61929 10.8333 10 10.8333Z"
				fill="#292A2B"
			/>
		</Svg>
	);
};

const useStyles = makeStyles(({ colors }, { index }: { index: number }) => ({
	container: {
		paddingVertical: 12,
		paddingHorizontal: 16,
		flexDirection: 'row',
		backgroundColor: index % 2 ? '#F9F9F9' : colors.white,
	},
	address: {
		color: colors.neutral400,
		fontSize: 12,
		paddingLeft: 4,
	},
	status: {
		color: colors.neutral400,
		fontSize: 12,
	},
	price: {
		fontSize: 12,
		color: colors.primary500,
		alignSelf: 'flex-end',
	},
}));

export default HistoryItem;
