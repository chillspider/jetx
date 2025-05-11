import { useNavigation, useRoute } from '@react-navigation/native';
import { makeStyles, Text } from '@rneui/themed';
import queryString from 'query-string';
import { isNotEmpty, isNotNil } from 'ramda';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView, WebViewNavigation } from 'react-native-webview';

import IcError from '@/assets/svgs/ic_error.svg';
import { Box, Dialog, Header, ScreenWrapper } from '@/components';
import { Loading } from '@/components/loading';
import { OrderStatusEnum } from '@/models/order/order-status.enum';
import { AppNavigationProp, AppRouteProp } from '@/types/navigation';

import { useAddCard } from '../../core/hooks/payment/useUserCardTokens';

const PaymentCreateCardScreen: React.FC = () => {
	const {
		params: { status: paymentStatus },
	} = useRoute<AppRouteProp<'CreatePaymentCard'>>();

	const navigation = useNavigation<AppNavigationProp<'CreatePaymentCard'>>();

	const { bottom } = useSafeAreaInsets();

	const processingRef = React.useRef(true);

	const { t } = useTranslation();
	const styles = useStyles();

	const { data: uri, isLoading, isError, refetch, isRefetchError } = useAddCard();

	const [showAlert, setShowAlert] = useState<boolean>(false);

	const goBack = useCallback(() => {
		processingRef.current = false;
		navigation.goBack();
	}, [navigation]);

	useEffect(() => {
		if (isNotNil(paymentStatus) && isNotEmpty(paymentStatus)) {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
			if (paymentStatus === OrderStatusEnum.COMPLETED) {
				goBack();
			} else {
				Alert.alert(t('payment_setting.add_card_error'), t('payment_setting.add_card_error'));
			}
		}
	}, [goBack, paymentStatus, t]);

	const showExitAlert = useCallback(() => {
		setShowAlert(true);
	}, []);

	const closeExitAlert = useCallback(() => {
		setShowAlert(false);
	}, []);

	const refetchPaymentUrl = useCallback(() => {
		refetch();
	}, [refetch]);

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

	const renderLoadingView = useCallback(() => {
		return <Loading />;
	}, []);

	const onNavigationStateChange = useCallback(
		(event: WebViewNavigation) => {
			const shouldHandleUrl = event.url.includes('tokenize/result');

			if (!event.loading && shouldHandleUrl) {
				const [, params] = event.url.split('?');
				const parsed = queryString.parse(params);
				const { status } = parsed;

				if (status) {
					if (status === OrderStatusEnum.COMPLETED) {
						goBack();
					} else {
						Alert.alert(t('payment_setting.add_card_error'), t('payment_setting.add_card_error'));
					}
				}
			}
		},

		[goBack, t],
	);

	return (
		<ScreenWrapper>
			<Header title={t('payment_setting.add_new_title')} />
			{isNotNil(uri) && (
				<WebView
					incognito
					style={[styles.webview, { paddingBottom: bottom + 24 }]}
					source={{ uri: uri || '' }}
					renderLoading={renderLoadingView}
					onNavigationStateChange={onNavigationStateChange}
				/>
			)}
			{(isError || isRefetchError) && (
				<Dialog
					isVisible={isError || isRefetchError}
					title={t('error')}
					closeLabel={t('payment_setting.back')}
					confirmLabel={t('payment_setting.retry')}
					onClosed={handleNavigateBack}
					onConfirm={refetchPaymentUrl}
				>
					<Box justifyContent="center" alignItems="center">
						<IcError />
						<Box height={12} />
						<Text style={styles.textAlign}>{t('payment_setting.url_not_found')}</Text>
					</Box>
				</Dialog>
			)}
			{showAlert && (
				<Dialog
					isVisible={showAlert}
					title={t('payment_setting.cancel')}
					description={t('payment_setting.cancel_add_card')}
					onClosed={closeExitAlert}
					onConfirm={handleNavigateBack}
				/>
			)}
			{isLoading && <Loading />}
		</ScreenWrapper>
	);
};

const useStyles = makeStyles(() => ({
	webview: {
		flex: 1,
	},
	textAlign: {
		textAlign: 'center',
	},
}));

export default PaymentCreateCardScreen;
