/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/require-await */
import messaging from '@react-native-firebase/messaging';
import { useIsFocused, useNavigation, useRoute } from '@react-navigation/native';
import { makeStyles, Text, useTheme } from '@rneui/themed';
import { isNil, isNotEmpty, isNotNil } from 'ramda';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppState, Platform, TouchableOpacity, View } from 'react-native';
import { Path, Svg } from 'react-native-svg';
import Toast from 'react-native-toast-message';

import IcInformation from '@/assets/svgs/ic_wash_information.svg';
import { Box, Dialog, Header } from '@/components';
import { Loading } from '@/components/loading';
import { useFnbOrderContext } from '@/core/contexts/fnb-order-context';
import { useOperationOrder } from '@/core/hooks/start-process/useOperationOrder';
import { useOrder } from '@/core/hooks/start-process/useOrder';
import { useRefreshOnFocus } from '@/core/hooks/useRefreshOnFocus';
import { useMqttContext } from '@/core/mqtt/context/mqtt-context';
import {
	MqttMessage,
	NotificationData,
	NotificationOrderData,
} from '@/models/notification/notification-order.dto';
import { OrderStatusEnum } from '@/models/order/order-status.enum';
import { OperationType } from '@/models/yigoli/operation-type.enum';
import { AppNavigationProp, AppRouteProp } from '@/types/navigation';

import { useStation } from '../../core/hooks/useStations';
import WaitingView from './components/waiting-wash-view';
import WashWarningView from './components/warning-view';
import WashCompleteView from './components/wash-complete-view';
import WashFailedDialog from './components/wash-failed-dialog';
import WashInformationDialog from './components/wash-information-dialog';
import WashStoppedView from './components/wash-stopped-view';
import WashingView from './components/washing-view';
import OrderSheetView from './pos/order-sheet-view';
import ProductSheetView from './pos/product-sheet-view';

const ProcessingScreen: React.FC = () => {
	const {
		params: { orderId },
	} = useRoute<AppRouteProp<'Processing'>>();

	const navigation = useNavigation<AppNavigationProp<'Processing'>>();

	const MQTT_TOPIC = `order_${orderId}`;

	const {
		theme: { colors },
	} = useTheme();

	const appState = useRef(AppState.currentState);

	const styles = useStyles();
	const { t } = useTranslation();

	const [stopDialog, setShowStopDialog] = useState(false);
	const [failedDialog, setShowFailedDialog] = useState(false);
	const [showInformation, setShowInformation] = useState(false);

	const { setShopId, setStation, setWashOrderId, reset } = useFnbOrderContext();
	const { data: order, isLoading, refetch } = useOrder({ variables: { id: orderId } });

	const hasFnbOrder = useMemo(
		() => isNotNil(order?.fnbOrderId) && isNotEmpty(order?.fnbOrderId),
		[order],
	);
	const showProductSheet = useMemo(() => {
		if (order) {
			return (
				!hasFnbOrder &&
				order.status === OrderStatusEnum.PROCESSING &&
				isNotNil(order.data?.shopId) &&
				isNotEmpty(order.data?.shopId)
			);
		}

		return false;
	}, [hasFnbOrder, order]);

	const isFocused = useIsFocused();

	useRefreshOnFocus(refetch);

	//! Handle MQTT
	const { mqttData, setDoMqttConnection, subscribeToTopics } = useMqttContext();

	const { data: station, refetch: refetchStation } = useStation({
		variables: order?.data?.stationId || '',
		enabled: false,
	});

	subscribeToTopics({ topics: [MQTT_TOPIC] });

	useEffect(() => {
		setDoMqttConnection(true);

		return () => {
			setDoMqttConnection(false);
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [orderId]);

	useEffect(() => {
		if (!hasFnbOrder && isNotNil(order?.data?.shopId) && isNotEmpty(order.data.shopId)) {
			setShopId(order.data!.shopId);
			setWashOrderId(order.id);
		}
	}, [order, setShopId, hasFnbOrder, setWashOrderId]);

	useEffect(() => {
		if (isNotNil(order?.data?.stationId)) {
			refetchStation();
		}
	}, [order, refetchStation]);

	useEffect(() => {
		if (isNotNil(station)) {
			setStation(station);
		}
	}, [station, setStation]);

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
	}, [MQTT_TOPIC, mqttData, order?.id, orderId, refetch]);

	useEffect(() => {
		const subscription = AppState.addEventListener('change', nextAppState => {
			if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
				refetch();
			}

			appState.current = nextAppState;
		});

		return () => {
			subscription.remove();
		};
	}, [refetch]);

	useEffect(() => {
		if (order?.status === OrderStatusEnum.FAILED) {
			setShowFailedDialog(true);
		} else {
			setShowFailedDialog(false);
		}
	}, [order?.status, isFocused]);

	useEffect(() => {
		const unsubscribe = messaging().onMessage(async remoteMessage => {
			try {
				if (remoteMessage.data) {
					const rawData = Platform.OS === 'android' ? remoteMessage.data : remoteMessage.data.data;
					const data: NotificationData = JSON.parse(JSON.stringify(rawData));
					if (data.type === 'order' && data.data) {
						const orderData: NotificationOrderData = JSON.parse(data.data);
						if (orderData.id === orderId) {
							refetch();
						}
					}
				}
			} catch (err) {
				console.log(err);
			}
		});

		return unsubscribe;
	}, [orderId, refetch]);

	const stopMutation = useOperationOrder({
		onSuccess: () => {
			Toast.show({
				type: 'success',
				text1: t('notificationTitle'),
				text2: t('process.stopWashSuccess'),
			});

			refetch();
		},
		onError: () => {
			Toast.show({
				type: 'error',
				text1: t('notificationTitle'),
				text2: t('networkError'),
			});
		},
	});

	const onStopProcess = useCallback(() => {
		if (isNotNil(order) && isNotNil(order.orderItems) && isNotEmpty(order.orderItems)) {
			stopMutation.mutate({
				orderId,
				deviceId: order.orderItems[0].data?.deviceId || '',
				operation: OperationType.STOP,
			});
		}
	}, [order, orderId, stopMutation]);

	const showDialogStopProcess = useCallback(() => {
		setShowStopDialog(true);
	}, []);

	const closeDialogStopProcess = useCallback(() => {
		setShowStopDialog(false);
	}, []);

	const onConfirmStop = useCallback(() => {
		closeDialogStopProcess();
		onStopProcess();
	}, [closeDialogStopProcess, onStopProcess]);

	const renderContentStatus = useCallback(() => {
		if (isNil(order?.status)) {
			return <Box />;
		}

		switch (order.status) {
			case OrderStatusEnum.PENDING:
				return <WaitingView />;
			case OrderStatusEnum.PROCESSING:
				return <WashingView order={order} onComplete={refetch} onStop={showDialogStopProcess} />;
			case OrderStatusEnum.COMPLETED:
				return <WashCompleteView order={order} />;
			case OrderStatusEnum.CANCELED:
				return <WashWarningView />;
			case OrderStatusEnum.ABNORMAL_STOP:
			case OrderStatusEnum.SELF_STOP:
				return <WashStoppedView order={order} />;

			default:
				return <Box />;
		}
	}, [order, refetch, showDialogStopProcess]);

	const onFailedConfirm = useCallback(() => {
		navigation.goBack();
	}, [navigation]);

	const gotoSupportCenter = useCallback(() => {
		setShowFailedDialog(false);
		navigation.navigate('Support');
	}, [navigation]);

	const onShowInformation = useCallback(() => {
		setShowInformation(true);
	}, []);

	const onCloseInformation = useCallback(() => {
		setShowInformation(false);
	}, []);

	useEffect(() => {
		const unsubscribe = navigation.addListener('beforeRemove', () => {
			reset();
		});
		return unsubscribe;
	}, [navigation, reset]);

	return (
		<View style={styles.container}>
			<Header
				type="modal"
				title={t('orderDetailView.processingTitle')}
				backgroundColor={colors.primary500}
				rightComponent={
					<TouchableOpacity onPress={onShowInformation}>
						<IcInformation />
					</TouchableOpacity>
				}
			/>
			<View style={styles.content}>
				{renderContentStatus()}
				{station && (
					<View style={styles.stationContainer}>
						<StationSvg />
						<Text style={styles.stationText}>{station?.name}</Text>
					</View>
				)}
			</View>
			{showProductSheet && <ProductSheetView />}
			{hasFnbOrder && <OrderSheetView orderId={order?.fnbOrderId || ''} />}
			{showInformation && (
				<WashInformationDialog
					isVisible={showInformation}
					order={order}
					onClose={onCloseInformation}
				/>
			)}
			{stopDialog && (
				<Dialog
					isVisible={stopDialog}
					title={t('process.stopWash')}
					description={t('process.stopWashDecs')}
					confirmLabel={t('process.stop')}
					closeLabel={t('continue')}
					onClosed={closeDialogStopProcess}
					onConfirm={onConfirmStop}
				/>
			)}
			{failedDialog && (
				<WashFailedDialog
					isVisible={failedDialog}
					onConfirm={onFailedConfirm}
					onGoSupport={gotoSupportCenter}
				/>
			)}
			{isLoading && <Loading />}
		</View>
	);
};

const StationSvg = () => {
	return (
		<Svg width="17" height="16" viewBox="0 0 17 16" fill="none">
			<Path
				d="M8.5 0.666748C5.19432 0.666748 2.5 3.36107 2.5 6.66675C2.5 8.99666 3.97237 10.9275 5.36849 12.2826C6.76461 13.6377 8.16146 14.4571 8.16146 14.4571C8.26404 14.5176 8.38093 14.5495 8.5 14.5495C8.61907 14.5495 8.73596 14.5176 8.83854 14.4571C8.83854 14.4571 10.2354 13.6377 11.6315 12.2826C13.0276 10.9275 14.5 8.99666 14.5 6.66675C14.5 3.36107 11.8057 0.666748 8.5 0.666748ZM8.5 2.00008C11.085 2.00008 13.1667 4.08176 13.1667 6.66675C13.1667 8.4155 11.9724 10.0924 10.7018 11.3256C9.60061 12.3945 8.77382 12.8754 8.5 13.0444C8.22618 12.8754 7.39939 12.3945 6.29818 11.3256C5.02763 10.0924 3.83333 8.4155 3.83333 6.66675C3.83333 4.08176 5.91501 2.00008 8.5 2.00008ZM8.5 4.00008C7.66667 4.00008 6.95682 4.33658 6.5013 4.84904C6.04579 5.36149 5.83333 6.0186 5.83333 6.66675C5.83333 7.3149 6.04579 7.972 6.5013 8.48446C6.95682 8.99691 7.66667 9.33341 8.5 9.33341C9.33333 9.33341 10.0432 8.99691 10.4987 8.48446C10.9542 7.972 11.1667 7.3149 11.1667 6.66675C11.1667 6.0186 10.9542 5.36149 10.4987 4.84904C10.0432 4.33658 9.33333 4.00008 8.5 4.00008ZM8.5 5.33341C9 5.33341 9.29015 5.49691 9.5013 5.73446C9.71245 5.972 9.83333 6.3149 9.83333 6.66675C9.83333 7.0186 9.71245 7.36149 9.5013 7.59904C9.29015 7.83658 9 8.00008 8.5 8.00008C8 8.00008 7.70985 7.83659 7.4987 7.59904C7.28755 7.36149 7.16667 7.0186 7.16667 6.66675C7.16667 6.3149 7.28755 5.972 7.4987 5.73446C7.70985 5.49691 8 5.33341 8.5 5.33341Z"
				fill="white"
			/>
		</Svg>
	);
};

const useStyles = makeStyles(({ colors }) => ({
	container: {
		flex: 1,
		backgroundColor: colors.primary500,
	},
	content: {
		flex: 1,
		paddingHorizontal: 16,
		backgroundColor: colors.primary500,
	},
	bottom: {
		backgroundColor: colors.white,
		borderTopLeftRadius: 40,
		borderTopRightRadius: 40,
		position: 'absolute',
		bottom: 0,
		left: 0,
		right: 0,
	},
	detailContent: {
		paddingTop: 16,
		paddingHorizontal: 16,
	},
	detailTitle: {
		fontWeight: '500',
		fontSize: 16,
		textAlign: 'center',
	},
	washDetail: {
		marginTop: 28,
		backgroundColor: colors.neutral100,
		padding: 12,
		borderRadius: 8,
		marginBottom: 20,
	},
	lineRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 8,
	},
	callButton: {
		flexDirection: 'row',
		alignSelf: 'center',
		justifyContent: 'center',
		alignItems: 'center',
	},
	callTitle: {
		color: colors.primary,
		paddingLeft: 4,
		fontSize: 14,
	},
	stationContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 4,
		marginTop: 16,
	},
	stationText: {
		fontSize: 16,
		fontWeight: '500',
		color: colors.white,
	},
}));

export default ProcessingScreen;
