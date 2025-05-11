/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable simple-import-sort/imports */
import { makeStyles, Text } from '@rneui/themed';
import LottieView from 'lottie-react-native';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Dimensions, View } from 'react-native';

import { OrderStatusEnum } from '@/models/order/order-status.enum';
import { OrderDto } from '@/models/order/order.dto';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ANIMATION_WIDTH = SCREEN_WIDTH / 2 > 220 ? SCREEN_WIDTH / 2 : 220;

type Props = {
	order: OrderDto;
};

const WashStoppedView: React.FC<Props> = ({ order }) => {
	const styles = useStyles();

	const { t } = useTranslation();

	const notiMsg = useMemo(() => {
		switch (order.status) {
			case OrderStatusEnum.FAILED:
			case OrderStatusEnum.REFUNDED:
				return '';

			case OrderStatusEnum.ABNORMAL_STOP:
				return t('process.abnormal_stop');

			case OrderStatusEnum.SELF_STOP:
				return t('process.self_stop');

			default:
				return '';
		}
	}, [order.status, t]);

	return (
		<View style={styles.container}>
			<LottieView
				style={styles.successView}
				autoPlay
				loop={false}
				source={require('@/assets/json/warning.json')}
			/>
			<View style={styles.noti}>
				<Text style={styles.notiText}>{notiMsg}</Text>
			</View>
		</View>
	);
};

const useStyles = makeStyles(({ colors }) => ({
	container: {
		justifyContent: 'center',
		alignItems: 'center',
	},
	successView: {
		width: ANIMATION_WIDTH,
		height: ANIMATION_WIDTH,
	},
	noti: {
		backgroundColor: colors.primary400,
		borderRadius: 8,
		paddingHorizontal: 16,
		paddingVertical: 8,
		marginTop: 24,
	},
	notiText: {
		color: colors.white,
	},
}));

export default WashStoppedView;
