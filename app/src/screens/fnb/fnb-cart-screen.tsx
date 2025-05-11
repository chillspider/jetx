import { useNavigation } from '@react-navigation/native';
import { Button, makeStyles, Text } from '@rneui/themed';
import { AxiosError } from 'axios';
import { isNotEmpty, isNotNil } from 'ramda';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Path, Svg } from 'react-native-svg';
import Toast from 'react-native-toast-message';

import { Box, ContentWrapper, Header, ScreenWrapper } from '@/components';
import { Loading } from '@/components/loading';
import { useFnbOrderContext } from '@/core/contexts/fnb-order-context';
import { useCreateOrder, useFnbPaymentOrder } from '@/core/hooks/useFnbOrders';
import { useAuth } from '@/core/store/auth';
import { FnbOrderItemRequest } from '@/models/order/request/fnb-order.request.dto';
import { AppNavigationProp } from '@/types/navigation';
import { displayPrice } from '@/utils/format';

import PaymentSelection from '../start-process/components/payment-selection';
import CartItemView from './components/cart-item-view';

const FnbCartScreen: React.FC = () => {
	const navigation = useNavigation<AppNavigationProp<'FnbCart'>>();

	const { t } = useTranslation('pos');
	const styles = useStyles();

	const {
		items,
		shopId,
		setOrder,
		order,
		station,
		paymentMethods,
		method,
		setPaymentMethod,
		washOrderId,
	} = useFnbOrderContext();

	const { user } = useAuth();

	const [saveCard, setSaveCard] = useState<boolean>(true);

	const { mutate: createOrder, isPending: isCreateOrderPending } = useCreateOrder({
		onSuccess: data => {
			console.log(data);
			setOrder(data);
		},
		onError: error => {
			console.log(error);

			Toast.show({
				type: 'error',
				text1: t('notificationTitle', { ns: 'common' }),
				text2: t('networkError', { ns: 'common' }),
			});
		},
	});

	const { mutate: paymentOrder, isPending: isPaymentOrderPending } = useFnbPaymentOrder({
		onSuccess: data => {
			console.log(data);
			if (!data.result) {
				Toast.show({
					type: 'error',
					text1: t('notificationTitle', { ns: 'common' }),
					text2: t('networkError', { ns: 'common' }),
				});
			}
			if (isNotNil(data.expiredAt) && isNotNil(order)) {
				navigation.replace('WaitingQR', {
					expiredAt: data.expiredAt,
					order,
					type: 'fnb',
				});
			} else if (isNotNil(data.endpoint) && isNotEmpty(data.endpoint)) {
				navigation.replace('Payment', {
					orderId: data.orderId,
					uri: data.endpoint,
					status: undefined,
					type: 'fnb',
				});
			} else {
				navigation.goBack();
			}
		},
		onError: (error: AxiosError) => {
			console.log(error);
			const err = error as AxiosError<{ response: { key: string; errMessage: string } }>;
			if (err?.response?.data?.response?.key === 'out_of_stock') {
				Toast.show({
					type: 'error',
					text1: t('notificationTitle', { ns: 'common' }),
					text2: t('out-of-stock', { product: err.response.data.response.errMessage }),
				});
			} else {
				Toast.show({
					type: 'error',
					text1: t('notificationTitle', { ns: 'common' }),
					text2: t('networkError', { ns: 'common' }),
				});
			}
		},
	});

	useEffect(() => {
		const orderItems = items.map(
			item =>
				new FnbOrderItemRequest(
					item.product.id,
					item.quantity,
					item.product.price,
					item.product.name,
					item.product.price,
					undefined,
					undefined,
					item.product.price * item.quantity,
					item.product.photo,
				),
		);
		createOrder({
			shopId: shopId!,
			orderItems,
			parentId: washOrderId,
		});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const { bottom: bottomInset } = useSafeAreaInsets();

	const isReady = useMemo(() => {
		return !!order && !!user && !isCreateOrderPending && !!method;
	}, [isCreateOrderPending, order, user, method]);

	const userInfo = useMemo(() => {
		if (!user) return '';
		const phone = user.phone ? ` | ${user.phone}` : '';
		return `${user?.fullName ?? ''} ${phone}`;
	}, [user]);

	const handlePayment = useCallback(() => {
		if (!isReady) return;

		paymentOrder({
			orderId: order!.id,
			paymentMethod: method!.method,
			paymentProvider: method!.provider,
			tokenId: method!.token?.id,
			isTokenize: saveCard,
		});
	}, [isReady, paymentOrder, order, method, saveCard]);

	return (
		<ScreenWrapper>
			<Header title={t('payment-title')} />
			{station && (
				<View style={styles.station}>
					<Box flexDirection="row">
						<IconLocation />
						<Box pl={8}>
							<Text>{station.name}</Text>
							<Box height={4} />
							<Text body2>{userInfo}</Text>
						</Box>
					</Box>
				</View>
			)}
			<ContentWrapper>
				<ScrollView showsVerticalScrollIndicator={false}>
					<Box
						flexDirection="row"
						justifyContent="space-between"
						py={4}
						mb={12}
						mt={24}
						alignItems="center"
					>
						<Text>{t('summary')}</Text>
						<TouchableOpacity
							onPress={() => {
								navigation.goBack();
							}}
						>
							<Text style={styles.addMore}>{t('add-more')}</Text>
						</TouchableOpacity>
					</Box>
					{items.map(item => (
						<CartItemView key={item.product.id} data={item.product} quantity={item.quantity} />
					))}
					<Box height={24} />
					<PaymentSelection
						items={paymentMethods || []}
						selectedMethod={method}
						onChanged={m => setPaymentMethod(m)}
						saveCard={saveCard}
						onSaveCard={() => {
							setSaveCard(!saveCard);
						}}
					/>
				</ScrollView>
				<View style={[styles.shadow, { paddingBottom: bottomInset + 12 }]}>
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
					<Button title={t('payment-title')} disabled={!isReady} onPress={handlePayment} />
				</View>
			</ContentWrapper>
			{(isCreateOrderPending || isPaymentOrderPending) && <Loading />}
		</ScreenWrapper>
	);
};

const IconLocation = () => {
	return (
		<Svg width="20" height="20" viewBox="0 0 20 20" fill="none">
			<Path
				opacity="0.35"
				d="M3.33337 8.33342C3.33337 4.65175 6.31837 1.66675 10 1.66675C13.6817 1.66675 16.6667 4.65175 16.6667 8.33342C16.6667 11.3034 13.28 15.5434 11.3342 17.7334C10.625 18.5317 9.37504 18.5317 8.66587 17.7334C6.72004 15.5434 3.33337 11.3034 3.33337 8.33342Z"
				fill="#292A2B"
			/>
			<Path
				d="M10 10.8333C11.3807 10.8333 12.5 9.71396 12.5 8.33325C12.5 6.95254 11.3807 5.83325 10 5.83325C8.61929 5.83325 7.5 6.95254 7.5 8.33325C7.5 9.71396 8.61929 10.8333 10 10.8333Z"
				fill="#292A2B"
			/>
		</Svg>
	);
};

const useStyles = makeStyles(({ colors }) => ({
	content: {
		flex: 1,
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
	addMore: {
		fontSize: 14,

		color: '#1A7CE4',
	},
	station: {
		backgroundColor: colors.neutral100,
		paddingVertical: 12,
		paddingHorizontal: 16,
	},
	shadow: {
		shadowColor: 'black',
		shadowOffset: {
			width: 0,
			height: -8,
		},
		shadowOpacity: 0.05,
		shadowRadius: 32,
	},
}));

export default FnbCartScreen;
