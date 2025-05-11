/* eslint-disable consistent-return */
import { useNavigation, useRoute } from '@react-navigation/native';
import { makeStyles, Text, useTheme } from '@rneui/themed';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image } from 'react-native';
import { AnimatedCircularProgress } from 'react-native-circular-progress';

import AppLogo from '@/assets/images/app-logo.png';
import { Box, ScreenWrapper } from '@/components';
import { AppNavigationProp, AppRouteProp } from '@/types/navigation';

const WAITING_TIME = 10;

const WaitingStartMachineScreen: React.FC = () => {
	const navigation = useNavigation<AppNavigationProp<'Waiting'>>();
	const {
		params: { orderId },
	} = useRoute<AppRouteProp<'Waiting'>>();
	const styles = useStyles();
	const { t } = useTranslation();

	const [timeLeft, setTimeLeft] = useState(WAITING_TIME);

	const {
		theme: { colors },
	} = useTheme();

	useEffect(() => {
		if (timeLeft === 0) {
			setTimeout(() => {
				navigation.replace('Processing', { orderId });
			}, 2000);

			return;
		}

		const intervalId = setInterval(() => {
			setTimeLeft(prevTime => prevTime - 1);
		}, 1000);

		return () => clearInterval(intervalId);
	}, [navigation, orderId, timeLeft]);

	const formatTime = useCallback((seconds: number) => {
		const minutes = Math.floor(seconds / 60);
		const remainingSeconds = seconds % 60;
		return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
	}, []);

	const fillValue = useMemo(() => {
		return ((WAITING_TIME - timeLeft) / WAITING_TIME) * 100;
	}, [timeLeft]);

	return (
		<ScreenWrapper justifyContent="center" alignItems="center">
			<Image source={AppLogo} />
			<Box height={40} />
			<Text h3>{t('process.waiting_title')}</Text>
			<Box height={20} />
			<AnimatedCircularProgress
				size={207}
				width={8}
				fill={fillValue}
				tintColor={colors.primary}
				lineCap="round"
				backgroundColor={colors.primary10}
				rotation={0}
				style={styles.progress}
				childrenContainerStyle={styles.content}
			>
				{() => (
					<Box justifyContent="center" alignItems="center" p={4}>
						<Text h2 h2Style={styles.timeFormat}>
							{formatTime(timeLeft)}
						</Text>
						<Box height={8} />
						{timeLeft === 0 ? (
							<Text body2 style={styles.timeLeft}>
								{t('process.will_start_now')}
							</Text>
						) : (
							<Text body2 style={styles.timeLeft}>
								{t('process.time_left', { timeLeft })}
							</Text>
						)}
					</Box>
				)}
			</AnimatedCircularProgress>
		</ScreenWrapper>
	);
};

const useStyles = makeStyles(({ colors }) => ({
	progress: {},
	content: {
		backgroundColor: colors.primary10,
	},
	timeFormat: {
		fontSize: 40,
	},
	timeLeft: {
		textAlign: 'center',
		fontWeight: '300',
		fontSize: 14,
	},
}));

export default WaitingStartMachineScreen;
