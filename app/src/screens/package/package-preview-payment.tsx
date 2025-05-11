/* eslint-disable simple-import-sort/imports */
import { useNavigation, useRoute } from '@react-navigation/native';
import { Button, Input, makeStyles, Text, useTheme } from '@rneui/themed';
import { head, isNotEmpty, isNotNil } from 'ramda';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import { Box, ContentWrapper, Header, ScreenWrapper } from '@/components';
import { PaymentMethodModel } from '@/models/payment/payment-method-model';
import { PaymentMethod } from '@/models/payment/payment-method.enum';
import { AppNavigationProp, AppRouteProp } from '@/types/navigation';
import { displayPrice } from '@/utils/format';

import { usePaymentMethod } from '@/core/hooks/start-process/usePaymentMethod';
import { usePaymentPackage } from '@/core/hooks/start-process/usePlaceOrder';

import PaymentSelection from '@/screens/start-process/components/payment-selection';

const PackagePreviewPayment: React.FC = () => {
	const navigation = useNavigation<AppNavigationProp<'PackagePrePayment'>>();

	const {
		params: { package: data },
	} = useRoute<AppRouteProp<'PackagePrePayment'>>();

	const { t } = useTranslation();
	const styles = useStyles();

	const { data: methods } = usePaymentMethod({ variables: { type: 'package' } });

	const [method, setPaymentMethod] = useState<PaymentMethodModel>();
	const [saveCard, setSaveCard] = useState<boolean>(true);
	const [employeeName, setEmployeeName] = useState<string>('');

	useEffect(() => {
		if (isNotNil(methods) && isNotEmpty(methods)) {
			const defaultMethod = methods.find(e => e.isDefault === true);
			setPaymentMethod(defaultMethod || head(methods));
		}
	}, [methods]);

	const { bottom } = useSafeAreaInsets();

	const paymentPackage = usePaymentPackage({
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
			}

			if (isNotNil(order.qrCode) && method?.method === PaymentMethod.QRPAY) {
				navigation.replace('PackageQRWaiting', {
					orderId: order.orderId,
					qrCode: order.qrCode,
					expiredAt: order.expiredAt || new Date(),
					price: data.price,
				});
			} else if (isNotNil(order.endpoint) && isNotEmpty(order.endpoint)) {
				navigation.replace('Payment', {
					orderId: order.orderId,
					uri: order.endpoint,
					status: undefined,
					type: 'package',
				});
			}
		},
	});

	const validated = useMemo(() => {
		return isNotNil(method) && isNotNil(data);
	}, [data, method]);

	const onPaymentOrder = useCallback(() => {
		if (!validated) {
			return;
		}

		paymentPackage.mutate({
			packageId: data.guid,
			paymentMethod: method!.method,
			paymentProvider: method!.provider,
			isTokenize: saveCard,
			tokenId: method?.token?.id,
			note: employeeName,
		});
	}, [data.guid, employeeName, method, paymentPackage, saveCard, validated]);

	const {
		theme: { colors },
	} = useTheme();

	const onEmployeeNameChange = useCallback((text: string) => {
		setEmployeeName(text);
	}, []);

	return (
		<ScreenWrapper>
			<Header title={t('package.pre_payment_title')} />
			<ContentWrapper>
				<ScrollView showsVerticalScrollIndicator={false}>
					<View style={styles.itemContent}>
						<Text style={styles.name}>{data.name}</Text>
						<Text style={styles.details}>{data.details}</Text>
					</View>
					<View>
						<Text style={styles.employeeName}>{t('package.employee_name')}</Text>
						<Input
							value={employeeName}
							onChangeText={onEmployeeNameChange}
							placeholder={t('package.employee_name_placeholder')}
							inputContainerStyle={styles.inputContainer}
							style={styles.input}
							containerStyle={styles.containerStyle}
							labelStyle={styles.labelStyle}
							placeholderTextColor={colors.neutral400}
						/>
					</View>
					<View style={styles.paymentContent}>
						<PaymentSelection
							items={methods || []}
							selectedMethod={method}
							onChanged={m => setPaymentMethod(m)}
							saveCard={saveCard}
							onSaveCard={() => {
								setSaveCard(!saveCard);
							}}
						/>
					</View>
				</ScrollView>
				<View style={[styles.bottomView, { paddingBottom: bottom + 16 }]}>
					<Box flexDirection="row" justifyContent="space-between" py={4} mb={12}>
						<Text style={styles.priceTitle}>{t('totalPrice')}</Text>
						<Text style={styles.priceTotal}>{displayPrice(data?.price)}</Text>
					</Box>
					<Button
						title={t('package.payment_title')}
						onPress={onPaymentOrder}
						disabled={!validated || paymentPackage.isPending}
						loading={paymentPackage.isPending}
					/>
				</View>
			</ContentWrapper>
		</ScreenWrapper>
	);
};

const useStyles = makeStyles(({ colors }) => ({
	bottomView: {
		backgroundColor: colors.white,
		paddingHorizontal: 16,
		paddingVertical: 12,
	},
	itemContent: {
		marginTop: 12,
	},
	name: {
		color: colors.primary,
		fontSize: 16,
	},
	details: {
		marginTop: 12,
		color: colors.neutral800,
		fontSize: 14,
	},
	paymentContent: {
		paddingTop: 12,
	},
	scrollContent: {
		flex: 1,
	},
	priceTotal: {
		fontSize: 16,
		color: colors.primary500,
	},
	priceTitle: {
		fontSize: 16,
	},
	employeeName: {
		marginTop: 24,
		fontSize: 16,
		color: colors.neutral800,
	},
	inputContainer: {
		borderWidth: 1,
		borderColor: colors.neutral200,
		borderRadius: 8,
		paddingHorizontal: 16,
		paddingVertical: 2,
		padding: 0,
		marginTop: 12,
	},
	containerStyle: {
		paddingHorizontal: 0,
	},
	input: {
		color: colors.neutral800,
		fontSize: 16,
	},
	labelStyle: {
		fontSize: 16,
		color: colors.neutral800,
		marginBottom: 6,
		fontWeight: '400',
		marginTop: 12,
	},
}));

export default PackagePreviewPayment;
