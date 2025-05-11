import { useNavigation, useRoute } from '@react-navigation/native';
import { Button, makeStyles, Text, useTheme } from '@rneui/themed';
import { isNil } from 'ramda';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { AppState, FlatList, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Box, Header, Image, ScreenWrapper } from '@/components';
import { Loading } from '@/components/loading';
import { useOrder } from '@/core/hooks/start-process/useOrder';
import { useRefreshOnFocus } from '@/core/hooks/useRefreshOnFocus';
import { useMqttContext } from '@/core/mqtt/context/mqtt-context';
import { MqttMessage, NotificationOrderData } from '@/models/notification/notification-order.dto';
import { OrderItemDto } from '@/models/order/order-item.dto';
import { OrderStatusEnum } from '@/models/order/order-status.enum';
import { AppNavigationProp, AppRouteProp } from '@/types/navigation';
import { displayPrice } from '@/utils/format';

const FnbOrderHistoryScreen: React.FC = () => {
	const {
		params: { order: orderParam },
	} = useRoute<AppRouteProp<'FnbOrderHistory'>>();

	const navigation = useNavigation<AppNavigationProp<'FnbOrderHistory'>>();

	const MQTT_TOPIC = `order_${orderParam.id}`;

	const { t } = useTranslation('pos');

	const styles = useStyles();
	const {
		theme: { colors },
	} = useTheme();

	const appState = useRef(AppState.currentState);
	const { data: order, refetch, isLoading } = useOrder({ variables: { id: orderParam.id } });

	useRefreshOnFocus(refetch);

	const { mqttData, setDoMqttConnection, subscribeToTopics } = useMqttContext();

	subscribeToTopics({ topics: [MQTT_TOPIC] });

	useEffect(() => {
		setDoMqttConnection(true);

		return () => {
			setDoMqttConnection(false);
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [orderParam]);

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
	}, [MQTT_TOPIC, mqttData, order?.id, orderParam.id, refetch]);

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

	const { bottom: bottomInset } = useSafeAreaInsets();

	const onBackToProcess = useCallback(() => {
		navigation.goBack();
	}, [navigation]);

	const orderItems = useMemo(() => {
		return order?.orderItems ?? [];
	}, [order]);

	const renderItem = useCallback(({ item }: { item: OrderItemDto }) => {
		return <OrderItemView data={item} />;
	}, []);

	const orderStatus = useMemo(() => {
		if (isNil(order?.status)) {
			return '';
		}

		switch (order.status) {
			case OrderStatusEnum.PENDING:
				return t('order-status.pending');
			case OrderStatusEnum.PROCESSING:
				return t('order-status.processing');
			case OrderStatusEnum.COMPLETED:
				return t('order-status.completed');
			case OrderStatusEnum.CANCELED:
				return t('order-status.canceled');
			case OrderStatusEnum.FAILED:
				return t('order-status.failed');
			case OrderStatusEnum.REFUNDED:
				return t('order-status.refunded');
			default:
				return '';
		}
	}, [order, t]);

	const orderStatusColor = useMemo(() => {
		switch (order?.status) {
			case OrderStatusEnum.PENDING:
			case OrderStatusEnum.PROCESSING:
				return colors.yellow;
			case OrderStatusEnum.COMPLETED:
				return colors.success;
			case OrderStatusEnum.FAILED:
			case OrderStatusEnum.REFUNDED:
			case OrderStatusEnum.CANCELED:
				return colors.error;
			default:
				return colors.neutral800;
		}
	}, [order, colors]);

	return (
		<ScreenWrapper>
			<Header title={t('order-sheet-title')} />
			<View style={styles.container}>
				<FlatList
					showsVerticalScrollIndicator={false}
					style={styles.scrollView}
					data={orderItems}
					keyExtractor={(item, index) => `${index}-${item.id}`}
					renderItem={renderItem}
					ItemSeparatorComponent={() => <Box height={12} />}
				/>
				<View style={[styles.bottomView, { paddingBottom: bottomInset + 12 }]}>
					<Box flexDirection="row" justifyContent="space-between" py={4}>
						<Text style={styles.grayText}>{t('order-status-title')}</Text>
						<Text style={[styles.grayText, { color: orderStatusColor }]}>{orderStatus}</Text>
					</Box>
					<Box flexDirection="row" justifyContent="space-between" py={4}>
						<Text style={styles.grayText}>{t('subtotal')}</Text>
						<Text style={styles.grayText}>{displayPrice(order?.subTotal || 0)}</Text>
					</Box>
					<Box flexDirection="row" justifyContent="space-between" py={4}>
						<Text style={styles.grayText}>{t('tax')}</Text>
						<Text style={styles.grayText}>{displayPrice(order?.taxAmount || 0)}</Text>
					</Box>
					<Box flexDirection="row" justifyContent="space-between" py={4}>
						<Text style={styles.grayText}>{t('extra-fee')}</Text>
						<Text style={styles.grayText}>{displayPrice(order?.extraFee || 0)}</Text>
					</Box>
					<Box flexDirection="row" justifyContent="space-between" py={4}>
						<Text style={styles.grayText}>{t('discount')}</Text>
						<Text style={styles.grayText}>-{displayPrice(order?.discountAmount || 0)}</Text>
					</Box>
					<Box flexDirection="row" justifyContent="space-between" py={4}>
						<Text>{t('total')}</Text>
						<Text style={styles.totalText}>{displayPrice(order?.grandTotal || 0)}</Text>
					</Box>
					<Box height={12} />
					<Button title={t('back-to-process')} onPress={onBackToProcess} />
				</View>
			</View>
			{isLoading && <Loading />}
		</ScreenWrapper>
	);
};

const OrderItemView = React.memo(({ data }: { data: OrderItemDto }) => {
	const styles = useStyles();

	return (
		<View style={styles.itemContainer}>
			<Image source={{ uri: data.photo }} style={styles.itemImage} />
			<View style={styles.itemContent}>
				<Text>{data.productName}</Text>
				<Text style={styles.itemPrice}>{displayPrice(data.price + (data.taxAmount || 0))}</Text>
			</View>
			<Text style={styles.itemQuantity}>x{data.qty || 0}</Text>
		</View>
	);
});

const useStyles = makeStyles(({ colors }) => ({
	container: {
		flex: 1,
	},
	bottomView: {
		backgroundColor: colors.white,
		paddingTop: 12,
		paddingHorizontal: 16,
		shadowColor: 'black',
		shadowOffset: {
			width: 0,
			height: -8,
		},
		shadowOpacity: 0.05,
		shadowRadius: 32,
	},
	grayText: {
		color: colors.neutral500,
		fontSize: 16,
	},
	totalText: {
		fontSize: 16,
		fontWeight: '500',
		color: colors.primary,
	},
	scrollView: {
		flex: 1,
		paddingHorizontal: 16,
		paddingTop: 24,
	},
	itemContainer: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	itemImage: {
		width: 48,
		height: 48,
		borderRadius: 4,
	},
	itemContent: {
		flex: 1,
		paddingLeft: 12,
	},
	itemPrice: {
		fontSize: 14,
		fontWeight: '300',
		color: colors.neutral500,
	},
	itemQuantity: {
		fontSize: 16,
		fontWeight: '500',
	},
}));

export default FnbOrderHistoryScreen;
