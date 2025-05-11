/* eslint-disable react-native/no-inline-styles */
import BottomSheet, { BottomSheetFlashList } from '@gorhom/bottom-sheet';
import { useNavigation } from '@react-navigation/native';
import { Button, makeStyles, Text, useTheme } from '@rneui/themed';
import { isNil } from 'ramda';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { AppState, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Box } from '@/components/box';
import { Loading } from '@/components/loading';
import { useOrder } from '@/core/hooks/start-process/useOrder';
import { useRefreshOnFocus } from '@/core/hooks/useRefreshOnFocus';
import { useMqttContext } from '@/core/mqtt/context/mqtt-context';
import { MqttMessage, NotificationOrderData } from '@/models/notification/notification-order.dto';
import { OrderItemDto } from '@/models/order/order-item.dto';
import { OrderStatusEnum } from '@/models/order/order-status.enum';
import { AppNavigationProp } from '@/types/navigation';
import { displayPrice } from '@/utils/format';

type Props = {
	orderId: string;
};

const OrderSheetView: React.FC<Props> = ({ orderId }) => {
	const navigation = useNavigation<AppNavigationProp<'Processing'>>();

	const styles = useStyles();
	const {
		theme: { colors },
	} = useTheme();
	const orderSheetRef = useRef<BottomSheet>(null);
	const snapPoints = useMemo(() => ['40%', '80%'], []);
	const { bottom: bottomInset } = useSafeAreaInsets();
	const { t } = useTranslation('pos');

	const { data: order, isLoading, refetch } = useOrder({ variables: { id: orderId } });

	const productItems = useMemo(() => order?.orderItems || [], [order]);

	useRefreshOnFocus(refetch);

	const appState = useRef(AppState.currentState);

	const MQTT_TOPIC = `order_${orderId}`;

	const { mqttData, setDoMqttConnection, subscribeToTopics } = useMqttContext();

	subscribeToTopics({ topics: [MQTT_TOPIC] });

	useEffect(() => {
		setDoMqttConnection(true);

		return () => {
			setDoMqttConnection(false);
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [orderId]);

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

	const onNavigateToOrderHistory = useCallback(() => {
		if (isNil(order)) {
			return;
		}
		navigation.navigate('FnbOrderHistory', { order });
	}, [order, navigation]);

	return (
		<View style={styles.content}>
			<BottomSheet
				ref={orderSheetRef}
				index={0}
				snapPoints={snapPoints}
				enablePanDownToClose={false}
				keyboardBehavior="extend"
				enableDynamicSizing={false}
			>
				<Box p={8} justifyContent="center" alignItems="center">
					<Text h4>{t('order')}</Text>
				</Box>
				<View style={styles.container}>
					<Box flexDirection="row" justifyContent="space-between" py={12}>
						<Text style={{ color: orderStatusColor, fontSize: 16 }}>{orderStatus}</Text>
						<Text style={styles.price}>{displayPrice(order?.grandTotal || 0)} </Text>
					</Box>
					<ProductListView orderItems={productItems} />
				</View>
			</BottomSheet>
			<View style={[styles.buttonView, { paddingBottom: bottomInset + 12 }]}>
				<Button
					title={t('order-sheet-title')}
					color={colors.primary50}
					titleStyle={{ color: colors.primary }}
					onPress={onNavigateToOrderHistory}
				/>
			</View>
			{isLoading && <Loading />}
		</View>
	);
};

const ProductListView = React.memo(({ orderItems }: { orderItems: OrderItemDto[] }) => {
	const styles = useStyles();

	const renderItem = useCallback(
		({ item, index }: { item: OrderItemDto; index: number }) => {
			return (
				<ProductItemView
					data={item}
					isFirst={index === 0}
					isLast={index === orderItems.length - 1}
				/>
			);
		},
		[orderItems],
	);

	return (
		<View style={styles.productView}>
			<BottomSheetFlashList
				keyboardDismissMode="on-drag"
				keyboardShouldPersistTaps="never"
				showsVerticalScrollIndicator={false}
				keyExtractor={(i, index) => `${i.id}-${index}`}
				data={orderItems}
				renderItem={renderItem}
				ListFooterComponent={<Box height={100} />}
				estimatedItemSize={68}
			/>
		</View>
	);
});

const ProductItemView = React.memo(
	({ data, isFirst, isLast }: { data: OrderItemDto; isFirst: boolean; isLast: boolean }) => {
		const styles = useStyles();

		return (
			<Box
				flexDirection="row"
				alignItems="center"
				justifyContent="space-between"
				p={8}
				backgroundColor="white"
				style={{
					borderTopRightRadius: isFirst ? 8 : 0,
					borderTopLeftRadius: isFirst ? 8 : 0,
					borderBottomRightRadius: isLast ? 8 : 0,
					borderBottomLeftRadius: isLast ? 8 : 0,
				}}
			>
				<Text style={styles.productName}>{data.productName}</Text>
				<Text style={styles.productQty}>{data.qty || 0}x</Text>
			</Box>
		);
	},
);

const useStyles = makeStyles(({ colors }) => ({
	content: {
		...StyleSheet.absoluteFillObject,
		pointerEvents: 'box-none',
	},
	container: {
		flex: 1,
		padding: 16,
		margin: 16,
		backgroundColor: colors.neutral100,
	},
	buttonView: {
		position: 'absolute',
		bottom: 0,
		left: 0,
		right: 0,
		backgroundColor: colors.white,
		paddingHorizontal: 16,
		paddingTop: 12,
	},
	scrollView: {
		flex: 1,
	},
	productView: {
		flex: 1,
	},
	productName: {
		fontSize: 16,
		fontWeight: '300',
	},
	productQty: {
		fontSize: 16,
		fontWeight: '500',
	},
	price: {
		fontSize: 16,
		fontWeight: '500',
		color: colors.primary,
	},
}));

export default OrderSheetView;
