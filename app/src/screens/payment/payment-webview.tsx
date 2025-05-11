/* eslint-disable @typescript-eslint/no-unsafe-enum-comparison */
import { useNavigation, useRoute } from '@react-navigation/native';
import { makeStyles } from '@rneui/themed';
import queryString from 'query-string';
import { isNotEmpty, isNotNil } from 'ramda';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { WebView, WebViewNavigation } from 'react-native-webview';

import { Dialog, Header, ScreenWrapper } from '@/components';
import { Loading } from '@/components/loading';
import { OrderStatusEnum } from '@/models/order/order-status.enum';
import { AppNavigationProp, AppRouteProp } from '@/types/navigation';

const PaymentWebView: React.FC = () => {
	const {
		params: { orderId, uri, status: paymentStatus, type },
	} = useRoute<AppRouteProp<'Payment'>>();

	const navigation = useNavigation<AppNavigationProp<'Payment'>>();
	const { bottom } = useSafeAreaInsets();

	const processingRef = React.useRef(true);

	const { t } = useTranslation();
	const styles = useStyles();

	const [showAlert, setShowAlert] = useState<boolean>(false);

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

	const navigateNextStep = useCallback(() => {
		processingRef.current = false;

		if (type === 'fnb') {
			navigation.goBack();
		} else if (type === 'package') {
			Toast.show({
				type: 'success',
				text1: t('package.qr_success'),
				text2: t('package.payment_success'),
			});
			navigation.reset({
				index: 0,
				routes: [{ name: 'MainTab' }],
			});
		} else {
			navigation.replace('Processing', {
				orderId,
			});
		}
	}, [navigation, orderId, t, type]);

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

	useEffect(() => {
		if (isNotNil(paymentStatus) && isNotEmpty(paymentStatus)) {
			if (paymentStatus === OrderStatusEnum.COMPLETED) {
				navigateNextStep();
			} else {
				Alert.alert(t('paymentError'), t('paymentErrorDecs'));
			}
		}
	}, [navigateNextStep, navigation, orderId, paymentStatus, t]);

	const renderLoadingView = useCallback(() => {
		return <Loading />;
	}, []);

	const onNavigationStateChange = useCallback(
		(event: WebViewNavigation) => {
			const shouldHandleUrl = event.url.includes('payment/result');

			if (!event.loading && shouldHandleUrl) {
				const [, params] = event.url.split('?');
				const parsed = queryString.parse(params);
				const { status } = parsed;

				if (status) {
					if (status === OrderStatusEnum.COMPLETED) {
						navigateNextStep();
					} else {
						Alert.alert(t('paymentError'), t('paymentErrorDecs'));
					}
				}
			}
		},

		[navigateNextStep, t],
	);

	return (
		<ScreenWrapper>
			<Header title={t('pay')} />
			<WebView
				incognito
				style={[styles.webview, { paddingBottom: bottom + 24 }]}
				source={{ uri: uri || '' }}
				renderLoading={renderLoadingView}
				onNavigationStateChange={onNavigationStateChange}
			/>
			{showAlert && (
				<Dialog
					isVisible={showAlert}
					title={t('cancelPaymentTitle')}
					description={t('canPaymentDecs')}
					onClosed={closeExitAlert}
					onConfirm={handleNavigateBack}
				/>
			)}
		</ScreenWrapper>
	);
};

const useStyles = makeStyles(() => ({
	container: {},
	webview: {
		flex: 1,
	},
}));

export default PaymentWebView;
