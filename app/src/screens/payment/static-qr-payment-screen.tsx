/* eslint-disable consistent-return */
import { useNavigation, useRoute } from '@react-navigation/native';
import { makeStyles, Text } from '@rneui/themed';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppState, View } from 'react-native';

import { Box, ContentWrapper, Dialog, Header, ScreenWrapper } from '@/components';
import { Loading } from '@/components/loading';
import { useCancelPayment } from '@/core/hooks/payment/useCancelPayment';
import { useMqttContext } from '@/core/mqtt/context/mqtt-context';
import { MqttMessage, NotificationOrderData } from '@/models/notification/notification-order.dto';
import { AppNavigationProp, AppRouteProp } from '@/types/navigation';
import { calculateTimeLeftInSeconds } from '@/utils/date-utils';
import { displayPrice } from '@/utils/format';

import { usePayment } from '../../core/hooks/payment/useCheckPayment';
import PaymentExpiredDialog from './components/payment-expired-dialog';

const WaitingStaticQRScreen: React.FC = () => {
	const {
		params: { order, expiredAt, type },
	} = useRoute<AppRouteProp<'WaitingQR'>>();
	const { t } = useTranslation();

	const styles = useStyles();
	const navigation = useNavigation<AppNavigationProp<'WaitingQR'>>();
	const [showAlert, setShowAlert] = useState<boolean>(false);

	const processingRef = useRef(true);

	const MQTT_TOPIC = `order_${order.id}`;

	const appState = useRef(AppState.currentState);

	const { mqttData, setDoMqttConnection, subscribeToTopics } = useMqttContext();
	const cancelMutation = useCancelPayment();

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

		cancelMutation.mutate(order.id);

		navigation.goBack();
	}, [cancelMutation, navigation, order]);

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

	const { data: isPay, isLoading, refetch } = usePayment({ variables: { id: order.id } });

	subscribeToTopics({ topics: [MQTT_TOPIC] });

	useEffect(() => {
		const recalculateTimeLeft = async () => {
			const time = await calculateTimeLeftInSeconds(expiredAt);

			setTimeLeft(time);
		};

		recalculateTimeLeft();
	}, [expiredAt]);

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
		setDoMqttConnection(true);

		return () => {
			setDoMqttConnection(false);
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [order.id]);

	const navigateProcessing = useCallback(() => {
		processingRef.current = false;
		if (type === 'fnb') {
			navigation.goBack();
		} else {
			navigation.replace('Processing', {
				orderId: order.id,
			});
		}
	}, [navigation, order, type]);

	useEffect(() => {
		if (isPay) {
			navigateProcessing();
		}
	}, [isPay, navigateProcessing, navigation]);

	useEffect(() => {
		if (mqttData && mqttData.topic === MQTT_TOPIC) {
			try {
				const rawData = mqttData.message.toString('utf-8');
				const data: MqttMessage = JSON.parse(rawData);
				const notificationData = data.data;
				if (notificationData.type === 'order') {
					const orderData: NotificationOrderData = notificationData.data;
					if (orderData.id === order?.id) {
						refetch();
					}
				}
			} catch (error) {
				console.log(error);
			}
		}
	}, [MQTT_TOPIC, mqttData, order?.id, refetch]);

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

	return (
		<ScreenWrapper>
			<Header type="modal" title={t('paymentQR.modalTitle')} />
			<ContentWrapper>
				<View style={styles.totalView}>
					<Text>{t('paymentQR.totalAmount')}</Text>
					<Text style={styles.price}>{displayPrice(order.grandTotal)}</Text>
				</View>
				<View style={styles.timeLeftView}>
					<Text style={styles.timeLeftNoti}>{t('paymentQR.payWithin')}</Text>
					<Box height={8} />
					<Text h2 h2Style={styles.timeLeft}>
						{formatTime(timeLeft)}
					</Text>
				</View>
				<Box height={20} />
				<View style={styles.guideView}>
					<Text style={styles.guideTitle}>{t('paymentQR.qrPaymentGuide.title')}</Text>
					<Text style={[styles.guideText, styles.highlight]}>
						{t('paymentQR.qrPaymentGuide.step1')}
					</Text>
					<Text style={styles.guideText}>{t('paymentQR.qrPaymentGuide.step2')}</Text>
					<Text style={styles.guideText}>{t('paymentQR.qrPaymentGuide.step3')}</Text>
					<Text style={styles.guideText}>{t('paymentQR.qrPaymentGuide.step4')}</Text>
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
	totalView: {
		marginTop: 20,
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	price: {
		fontWeight: '500',
		color: colors.primary,
	},
	timeLeftView: {
		marginTop: 20,
		borderRadius: 12,
		padding: 12,
		backgroundColor: colors.yellow2,
		justifyContent: 'center',
		alignItems: 'center',
		alignSelf: 'center',
	},
	timeLeft: {
		textAlign: 'center',
		fontWeight: '700',
		fontSize: 40,
		color: colors.primary,
	},
	timeLeftNoti: {
		fontWeight: '500',
	},
	guideView: {
		backgroundColor: colors.neutral100,
		padding: 12,
		borderRadius: 8,
	},
	guideTitle: {
		fontSize: 14,
		textAlign: 'center',
	},
	guideText: {
		marginTop: 8,
		fontSize: 14,
		fontWeight: '300',
	},
	highlight: {
		fontWeight: '400',
		color: colors.primary,
	},
}));

export default WaitingStaticQRScreen;
