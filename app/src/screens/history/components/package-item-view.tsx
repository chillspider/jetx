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

const PackageItem: React.FC<Props> = ({ data, index }) => {
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
			<ItemIcon />
			<Box flex={1} px={8}>
				<Text numberOfLines={2}>{data.data?.packageName || ''}</Text>
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

const ItemIcon = () => {
	return (
		<Svg width="20" height="20" viewBox="0 0 20 20" fill="none">
			<Path
				opacity="0.35"
				d="M18.6942 7.43033C18.2975 6.94449 17.71 6.66699 17.0833 6.66699H2.91667C2.29 6.66699 1.7025 6.94449 1.30583 7.43033C0.908332 7.91533 0.750832 8.54533 0.874166 9.15949L1.84083 13.9878C2.15167 15.5403 3.52583 16.667 5.10917 16.667H14.8908C16.4733 16.667 17.8483 15.5403 18.1592 13.9878L19.1258 9.15949C19.2492 8.54449 19.0917 7.91449 18.6942 7.43033Z"
				fill="#292A2B"
			/>
			<Path
				d="M14.1667 10.0003C14.1667 9.54033 13.7933 9.16699 13.3333 9.16699C12.8733 9.16699 12.5 9.54033 12.5 10.0003C12.5 10.2145 12.5 13.1195 12.5 13.3337C12.5 13.7937 12.8733 14.167 13.3333 14.167C13.7933 14.167 14.1667 13.7937 14.1667 13.3337C14.1667 13.1195 14.1667 10.2145 14.1667 10.0003Z"
				fill="#292A2B"
			/>
			<Path
				d="M7.5 10.0003C7.5 9.54033 7.12667 9.16699 6.66667 9.16699C6.20667 9.16699 5.83334 9.54033 5.83334 10.0003C5.83334 10.2145 5.83334 13.1195 5.83334 13.3337C5.83334 13.7937 6.20667 14.167 6.66667 14.167C7.12667 14.167 7.5 13.7937 7.5 13.3337C7.5 13.1195 7.5 10.2145 7.5 10.0003Z"
				fill="#292A2B"
			/>
			<Path
				d="M10.8333 10.0003C10.8333 9.54033 10.46 9.16699 10 9.16699C9.54 9.16699 9.16666 9.54033 9.16666 10.0003C9.16666 10.2145 9.16666 13.1195 9.16666 13.3337C9.16666 13.7937 9.54 14.167 10 14.167C10.46 14.167 10.8333 13.7937 10.8333 13.3337C10.8333 13.1195 10.8333 10.2145 10.8333 10.0003Z"
				fill="#292A2B"
			/>
			<Path
				d="M6.30167 6.66699L6.9775 3.96449C7.07 3.59283 7.4025 3.33366 7.785 3.33366H12.2142C12.5975 3.33366 12.93 3.59283 13.0225 3.96449L13.6983 6.66699H15.4167L14.64 3.56033C14.3617 2.44783 13.3617 1.66699 12.215 1.66699H7.785C6.6375 1.66699 5.6375 2.44783 5.36 3.56033L4.58334 6.66699H6.30167Z"
				fill="#292A2B"
			/>
		</Svg>
	);
};

export default PackageItem;
