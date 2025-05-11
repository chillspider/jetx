// eslint-disable-next-line simple-import-sort/imports
import { useNavigation } from '@react-navigation/native';
import { Button, makeStyles, Text } from '@rneui/themed';
import { isNil, isNotEmpty, isNotNil } from 'ramda';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import { Box } from '@/components';
import { DeviceDto } from '@/models/devices/device.dto';
import { OrderDto } from '@/models/order/order.dto';
import { AppNavigationProp } from '@/types/navigation';
import { displayPrice } from '@/utils/format';

import { usePaymentContext } from '@/core/contexts/payment-context';
import {
	usePaymentOrder,
	usePlaceOrder,
	useUpdateOrder,
} from '@/core/hooks/start-process/usePlaceOrder';
import { getWashMode } from '@/models/yigoli/wash-mode.enum';
import PaymentSelection from './payment-selection';
import VoucherSelection from './voucher-selection';
import WashMode from './wash-mode';

type Props = {
	onNext?: () => void;
	device: DeviceDto;
};

const StepPayment: React.FC<Props> = ({ device }) => {
	const navigation = useNavigation<AppNavigationProp<'StartProcess'>>();

	const styles = useStyles();

	const { bottom } = useSafeAreaInsets();

	const { t } = useTranslation();

	const {
		selectedVoucher,
		setSelectedVoucher,
		paymentMethods,
		method,
		setPaymentMethod,
		washMode,
		setWashMode,
		updateAutoSelectedVoucher,
	} = usePaymentContext();

	const [saveCard, setSaveCard] = useState<boolean>(true);
	const [crrOrder, setOrder] = useState<OrderDto>();

	const mutationCreateOrder = usePlaceOrder({
		onError: () => {
			Toast.show({
				type: 'error',
				text1: t('notificationTitle'),
				text2: t('networkError'),
			});
		},
		onSuccess: order => {
			setOrder(order);
			const { discountIds } = order;
			if (isNotNil(discountIds) && isNotEmpty(discountIds)) {
				const autoApplyVoucherId = discountIds[0];
				updateAutoSelectedVoucher(autoApplyVoucherId);
			}
		},
	});

	const mutationUpdateOrder = useUpdateOrder({
		onError: () => {
			Toast.show({
				type: 'error',
				text1: t('notificationTitle'),
				text2: t('networkError'),
			});
		},
		onSuccess: order => {
			setOrder(order);
			const { discountIds = [] } = order;
			if (discountIds.length > 0) {
				const orderVoucherId = discountIds[0];
				if (orderVoucherId !== selectedVoucher?.id) {
					updateAutoSelectedVoucher(orderVoucherId);
				}
			} else {
				setSelectedVoucher(undefined);
			}
		},
	});

	const paymentOrder = usePaymentOrder({
		onError: () => {
			Toast.show({
				type: 'error',
				text1: t('notificationTitle'),
				text2: t('networkError'),
			});
		},
		onSuccess: order => {
			if (!order.result) {
				Toast.show({
					type: 'error',
					text1: t('notificationTitle'),
					text2: t('networkError'),
				});
				return;
			}

			if (isNotNil(order.expiredAt) && isNotNil(crrOrder)) {
				navigation.replace('WaitingQR', {
					expiredAt: order.expiredAt,
					order: crrOrder,
					type: 'default',
				});
			} else if (isNotNil(order.endpoint) && isNotEmpty(order.endpoint)) {
				navigation.replace('Payment', {
					orderId: order.orderId,
					uri: order.endpoint,
					status: undefined,
					type: 'default',
				});
			} else {
				navigation.replace('Processing', {
					orderId: order.orderId,
				});
			}
		},
	});

	useEffect(() => {
		if (isNotNil(washMode)) {
			mutationCreateOrder.mutate({
				deviceId: device.id,
				modeId: washMode.id,
				voucherId: selectedVoucher?.id,
			});
		}

		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	useEffect(() => {
		if (isNotNil(crrOrder) && isNotNil(washMode)) {
			mutationUpdateOrder.mutate({
				id: crrOrder.id,
				modeId: washMode.id,
				deviceId: device.id,
				voucherId: selectedVoucher?.id,
			});
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [washMode, selectedVoucher]);

	useEffect(() => {
		if (isNotNil(crrOrder) && isNotNil(washMode)) {
			mutationUpdateOrder.mutate(
				{
					id: crrOrder.id,
					modeId: washMode.id,
					deviceId: device.id,
					voucherId: selectedVoucher?.id,
				},
				{
					onError: (error: any) => {
						const { discountIds } = crrOrder;
						if (isNotNil(discountIds) && isNotEmpty(discountIds)) {
							const autoApplyVoucherId = discountIds[0];
							updateAutoSelectedVoucher(autoApplyVoucherId);
						}

						console.log(error);
					},
				},
			);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [selectedVoucher]);

	const validated = useMemo(() => {
		return isNotNil(method) && isNotNil(crrOrder);
	}, [crrOrder, method]);

	const onPaymentOrder = useCallback(() => {
		if (!validated) {
			return;
		}

		paymentOrder.mutate({
			orderId: crrOrder!.id,
			paymentMethod: method!.method,
			paymentProvider: method!.provider,
			tokenId: method!.token?.id,
			isTokenize: saveCard,
		});
	}, [crrOrder, method, paymentOrder, saveCard, validated]);

	const navigateVouchers = () => {
		const mode = getWashMode(washMode?.code);

		if (isNil(mode)) return;

		navigation.navigate('OrderVoucher', {
			orderValue: crrOrder?.subTotal,
			select: selectedVoucher,
			stationId: device.stationId,
			deviceId: device.id,
			onConfirm: v => {
				setSelectedVoucher(v);
			},
			washMode: mode,
		});
	};

	return (
		<View style={[styles.container]}>
			<ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
				<VoucherSelection onChange={navigateVouchers} voucher={selectedVoucher} />
				<WashMode
					items={device.modes || []}
					selectedItem={washMode}
					onChanged={changed => setWashMode(changed)}
				/>
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
			<View style={[styles.bottom, { paddingBottom: bottom + 16 }]}>
				<Text>{t('pay')}</Text>
				<Box flexDirection="row" justifyContent="space-between" py={4} mt={12}>
					<Text body2>
						{t('priceWashing', {
							mode: washMode?.name || '',
						})}
					</Text>
					<Text body2>{displayPrice(crrOrder?.subTotal || 0)}</Text>
				</Box>
				{!!crrOrder?.membershipAmount && (
					<Box flexDirection="row" justifyContent="space-between" py={4}>
						<Text body2>{t('process.membership')}</Text>
						<Text body2>-{displayPrice(crrOrder?.membershipAmount || 0)}</Text>
					</Box>
				)}
				<Box flexDirection="row" justifyContent="space-between" py={4}>
					<Text body2>{t('discount')}</Text>
					<Text body2>-{displayPrice(crrOrder?.discountAmount || 0)}</Text>
				</Box>
				<Box flexDirection="row" justifyContent="space-between" py={4}>
					<Text body2>{t('totalPrice')}</Text>
					<Text body2 style={styles.priceTotal}>
						{displayPrice(crrOrder?.grandTotal || 0)}
					</Text>
				</Box>
				<Box height={12} />
				<Button
					title={t('process.startProcess')}
					onPress={onPaymentOrder}
					disabled={!validated || paymentOrder.isPending}
					loading={paymentOrder.isPending}
				/>
			</View>
		</View>
	);
};

const useStyles = makeStyles(({ colors }) => ({
	container: {
		flex: 1,
	},
	content: {
		flex: 1,
	},
	bottom: {
		backgroundColor: colors.white,
		paddingTop: 16,
	},
	priceTotal: {
		color: colors.primary500,
	},
}));

export default StepPayment;
