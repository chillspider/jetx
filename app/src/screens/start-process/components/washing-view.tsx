/* eslint-disable react-hooks/rules-of-hooks */
// eslint-disable-next-line simple-import-sort/imports
import { makeStyles, Text, useTheme } from '@rneui/themed';

import { isNil, isNotEmpty } from 'ramda';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TouchableOpacity, View } from 'react-native';
import { AnimatedCircularProgress } from 'react-native-circular-progress';

import { Box } from '@/components';
import { OrderStatusEnum } from '@/models/order/order-status.enum';
import { OrderDto } from '@/models/order/order.dto';
import { calculateProgress, calculateRemainingTime } from '@/utils/date-utils';

type Props = {
	order: OrderDto;
	onStop?: () => void;
	onComplete?: () => void;
};

const WashingView: React.FC<Props> = ({ order, onStop, onComplete }) => {
	const styles = useStyles();

	const { t } = useTranslation();

	const {
		theme: { colors },
	} = useTheme();

	if (isNil(order.data)) {
		return <></>;
	}

	const [progress, setProgress] = useState<number>(0);
	const [remainingTime, setRemainingTime] = useState<string>('');

	useEffect(() => {
		const intervalId = setInterval(() => {
			if (isNil(order.data)) return;

			const currentPg = calculateProgress(
				order.data.startTime || new Date(),
				order.data.estEndTime || new Date(),
			);
			if (currentPg > 0) {
				setProgress(currentPg);
			}

			const remaining = calculateRemainingTime(order.data.estEndTime || new Date());
			setRemainingTime(remaining);

			if (currentPg >= 100) {
				if (onComplete) {
					onComplete();
				}
				clearInterval(intervalId);
			}
		}, 1000);

		return () => clearInterval(intervalId);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [order]);

	const stillProcessing = useMemo(() => {
		return progress < 100;
	}, [progress]);

	const renderProgress = () => {
		return (
			<Box justifyContent="center" alignItems="center">
				<Text style={styles.processTitle}>{progress}%</Text>
				{stillProcessing && isNotEmpty(remainingTime) && (
					<>
						<Text style={styles.remainTime}>{t('process.estimate')}</Text>
						<Text style={styles.remainTime}>{remainingTime}</Text>
					</>
				)}
			</Box>
		);
	};

	const isPending = useMemo(() => {
		return order.status === OrderStatusEnum.PENDING;
	}, [order.status]);

	return (
		<View style={styles.container}>
			<AnimatedCircularProgress
				size={207}
				width={15}
				fill={progress}
				tintColor={colors.yellow}
				lineCap="round"
				backgroundColor={colors.primary400}
				rotation={0}
				style={styles.progress}
			>
				{() => renderProgress()}
			</AnimatedCircularProgress>
			<Box height={48} />
			{isPending && (
				<View style={styles.noti}>
					<Text style={styles.notiText}>{t('process.pendingNoti')}</Text>
				</View>
			)}
			{!isPending && (
				<TouchableOpacity style={styles.stopButton} onPress={onStop}>
					<Text style={styles.stopTitle}>{t('process.stopWash')}</Text>
				</TouchableOpacity>
			)}
		</View>
	);
};

const useStyles = makeStyles(({ colors }) => ({
	container: {
		justifyContent: 'center',
		alignItems: 'center',
	},
	stopTitle: {
		color: colors.primary500,
	},
	stopButton: {
		paddingHorizontal: 16,
		paddingVertical: 10,
		backgroundColor: colors.neutral50,
		borderRadius: 8,
		alignItems: 'center',
		alignSelf: 'center',
	},
	processTitle: {
		fontSize: 40,
		fontWeight: '600',
		color: colors.neutral50,
	},
	remainTime: {
		fontSize: 14,
		fontWeight: '300',
		color: colors.neutral50,
	},
	progress: {
		marginTop: 24,
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

export default WashingView;
