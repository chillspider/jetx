/* eslint-disable consistent-return */
import { CameraRoll } from '@react-native-camera-roll/camera-roll';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Button, makeStyles, Text, useTheme } from '@rneui/themed';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppState, Platform, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import Toast from 'react-native-toast-message';
import { captureRef } from 'react-native-view-shot';

import IcDownload from '@/assets/svgs/ic_download.svg';
import { ContentWrapper, Dialog, Header, ScreenWrapper } from '@/components';
import BarcodeMask from '@/components/barcode-mask/barcode-mask';
import { Loading } from '@/components/loading';
import { hasAndroidPermission } from '@/core/hooks/useStoragePermission';
import { useMqttContext } from '@/core/mqtt/context/mqtt-context';
import { MqttMessage, NotificationOrderData } from '@/models/notification/notification-order.dto';
import { AppNavigationProp, AppRouteProp } from '@/types/navigation';
import { calculateTimeLeftInSeconds } from '@/utils/date-utils';
import { displayPrice } from '@/utils/format';

import { usePayment } from '../../core/hooks/payment/useCheckPayment';
import PaymentExpiredDialog from '../payment/components/payment-expired-dialog';

const PackageQRWaitingScreen: React.FC = () => {
	const {
		params: { qrCode, orderId, price, expiredAt },
	} = useRoute<AppRouteProp<'PackageQRWaiting'>>();

	const { t } = useTranslation();

	const styles = useStyles();

	const qrRef = useRef(null);

	const navigation = useNavigation<AppNavigationProp<'PackageQRWaiting'>>();
	const [showAlert, setShowAlert] = useState<boolean>(false);

	const processingRef = useRef(true);

	const MQTT_TOPIC = `order_${orderId}`;

	const appState = useRef(AppState.currentState);

	const { mqttData, setDoMqttConnection, subscribeToTopics } = useMqttContext();

	const [timeLeft, setTimeLeft] = useState<number>(1000);

	const showExitAlert = useCallback(() => {
		setShowAlert(true);
	}, []);

	const closeExitAlert = useCallback(() => {
		setShowAlert(false);
	}, []);

	const handleNavigateBack = useCallback(() => {
		processingRef.current = false;
		setShowAlert(false);
		navigation.goBack();
	}, [navigation]);

	useEffect(() => {
		const unsubscribe = navigation.addListener('beforeRemove', e => {
			if (!processingRef.current) {
				return;
			}

			e.preventDefault();
			showExitAlert();
		});

		return unsubscribe;
	}, [navigation, showExitAlert]);

	const { data: isPay, isLoading, refetch } = usePayment({ variables: { id: orderId } });

	subscribeToTopics({ topics: [MQTT_TOPIC] });

	useEffect(() => {
		if (timeLeft <= 0) {
			return;
		}

		const intervalId = setInterval(() => {
			setTimeLeft(prevTime => prevTime - 1);
		}, 1000);

		return () => clearInterval(intervalId);
	}, [navigation, timeLeft]);

	useEffect(() => {
		const recalculateTimeLeft = async () => {
			const time = await calculateTimeLeftInSeconds(expiredAt);
			setTimeLeft(time);
		};

		recalculateTimeLeft();
	}, [expiredAt]);

	useEffect(() => {
		setDoMqttConnection(true);

		return () => {
			setDoMqttConnection(false);
		};
	}, [orderId, setDoMqttConnection]);

	const navigateVoucher = useCallback(() => {
		processingRef.current = false;
		navigation.reset({
			index: 0,
			routes: [{ name: 'MainTab' }],
		});
	}, [navigation]);

	useEffect(() => {
		if (isPay) {
			Toast.show({
				type: 'success',
				text1: t('package.qr_success'),
				text2: t('package.payment_success'),
			});

			navigateVoucher();
		}
	}, [isPay, navigateVoucher, navigation, t]);

	useEffect(() => {
		if (mqttData && mqttData.topic === MQTT_TOPIC) {
			try {
				const rawData = mqttData.message.toString('utf-8');
				const data: MqttMessage = JSON.parse(rawData);
				const notificationData = data.data;
				if (notificationData.type === 'order') {
					const orderData: NotificationOrderData = notificationData.data;
					if (orderData.id === orderId) {
						refetch();
					}
				}
			} catch (error) {
				console.log(error);
			}
		}
	}, [MQTT_TOPIC, mqttData, orderId, refetch]);

	useEffect(() => {
		const recalculateTimeLeft = async () => {
			const time = await calculateTimeLeftInSeconds(expiredAt);
			setTimeLeft(time);
		};

		const subscription = AppState.addEventListener('change', nextAppState => {
			if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
				refetch();
				recalculateTimeLeft();
			}
			appState.current = nextAppState;
		});

		return () => {
			subscription.remove();
		};
	}, [expiredAt, refetch]);

	const isExpired = useMemo(() => {
		return timeLeft <= 0;
	}, [timeLeft]);

	const formatTime = useCallback((seconds: number) => {
		const minutes = Math.floor(seconds / 60);
		const remainingSeconds = seconds % 60;
		return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
	}, []);

	const handleSaveQR = useCallback(async () => {
		try {
			if (Platform.OS === 'android' && !(await hasAndroidPermission())) {
				return;
			}

			const uri = await captureRef(qrRef, {
				format: 'png',
				quality: 1,
				result: 'tmpfile',
			});

			await CameraRoll.saveAsset(uri, { type: 'photo' });

			Toast.show({
				type: 'success',
				text1: t('package.qr_success'),
				text2: t('package.qr_saved'),
			});
		} catch (error) {
			console.log(error);

			Toast.show({
				type: 'error',
				text1: t('package.qr_save_error'),
			});
		}
	}, [t]);

	const {
		theme: { colors },
	} = useTheme();

	return (
		<ScreenWrapper>
			<Header title={t('package.payment_title')} />
			<ContentWrapper>
				<View style={styles.timeRemaining}>
					<Text>
						{t('package.time_remaining')}
						<Text style={styles.timeRemainingHighlight}>{formatTime(timeLeft)}</Text>
					</Text>
				</View>

				<View>
					<BarcodeMask
						backgroundColor="transparent"
						edgeColor={colors.primary}
						showAnimatedLine={false}
						height={240}
						width={240}
					/>
					<View ref={qrRef} style={styles.qrView} collapsable={false}>
						<QRCode value={qrCode} size={200} />
					</View>
				</View>
				<Button
					onPress={handleSaveQR}
					title={
						<View style={styles.downloadQR}>
							<IcDownload />
							<Text style={styles.downloadQRText}>{t('package.download_qr')}</Text>
						</View>
					}
				/>
				<View style={styles.content}>
					<Text style={styles.qrPriceTitle}>{t('package.qr_price_title')}</Text>
					<Text style={styles.qrPrice}>{displayPrice(price)}</Text>
				</View>
			</ContentWrapper>
			{isExpired && <PaymentExpiredDialog onClose={handleNavigateBack} />}
			{showAlert && (
				<Dialog
					isVisible={showAlert}
					title={t('cancelPaymentTitle')}
					description={t('canPaymentDecs')}
					onClosed={closeExitAlert}
					onConfirm={handleNavigateBack}
				/>
			)}
			{isLoading && <Loading />}
		</ScreenWrapper>
	);
};

const useStyles = makeStyles(({ colors }) => ({
	content: {
		backgroundColor: colors.neutral100,
		borderRadius: 8,
		padding: 12,
		marginTop: 24,
	},
	timeRemaining: {
		backgroundColor: colors.green2,
		borderRadius: 40,
		paddingVertical: 8,
		paddingHorizontal: 20,
		alignSelf: 'center',
	},
	downloadQR: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
	},
	downloadQRText: {
		fontSize: 16,
		color: colors.white,
		marginLeft: 8,
	},
	qrPriceTitle: {
		fontSize: 16,
		color: colors.neutral500,
	},
	qrPrice: {
		marginTop: 8,
		fontSize: 30,
		color: colors.primary,
	},
	qrView: {
		alignSelf: 'center',
		marginVertical: 48,
	},
	timeRemainingHighlight: {
		color: colors.green,
	},
}));

export default PackageQRWaitingScreen;
