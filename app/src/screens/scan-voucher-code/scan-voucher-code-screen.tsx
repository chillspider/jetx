/* eslint-disable @typescript-eslint/no-unused-vars */
import { useIsFocused, useNavigation, useRoute } from '@react-navigation/native';
import { makeStyles } from '@rneui/themed';
import { isEmpty, isNotEmpty, last } from 'ramda';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import Toast from 'react-native-toast-message';
import {
	Camera,
	useCameraDevice,
	useCameraPermission,
	useCodeScanner,
} from 'react-native-vision-camera';

import { Loading } from '@/components/loading';
import { useIsForeground } from '@/core/hooks/useIsForeground';
import { useRedeemCode } from '@/core/hooks/useVouchers';
import { AppNavigationProp, AppRouteProp } from '@/types/navigation';

import CameraNotSupportView from '../scan/components/camera-not-support-view';
import RedeemInputDialog, { PREFIX_REDEEM_CODE } from './components/redeem-input-dialog';
import VoucherCustomBarcodeMask from './components/voucher-custom-barcode-mask';

const options = {
	enableVibrateFallback: true,
	ignoreAndroidSystemSettings: false,
};

const ScanVoucherCodeScreen: React.FC = () => {
	const navigation = useNavigation<AppNavigationProp<'ScanVoucherCode'>>();
	const {
		params: { onBack },
	} = useRoute<AppRouteProp<'ScanVoucherCode'>>();

	const { top: topInset } = useSafeAreaInsets();
	const { t } = useTranslation();

	const styles = useStyles({ topInset });

	const cameraDevice = useCameraDevice('back');
	const [qrCode, setQRCode] = useState<string>('');
	const [manualInput, setManualInput] = useState<boolean>(false);

	const { hasPermission, requestPermission } = useCameraPermission();

	const isFocused = useIsFocused();
	const isForeground = useIsForeground();
	const isActive = isFocused && isForeground;

	const onGoBack = useCallback(() => {
		if (navigation.canGoBack()) {
			navigation.goBack();
		}
	}, [navigation]);

	const mutation = useRedeemCode({
		onSuccess: data => {
			onManualInputClose();
			//! Navigate with value
			if (onBack) {
				onBack(data);
			}
			navigation.goBack();
		},
		onError: () => {
			Toast.show({
				type: 'error',
				text1: t('notificationTitle'),
				text2: t('redeem.code_invalid'),
			});
		},
		onSettled: () => {
			setTimeout(() => {
				setQRCode('');
			}, 2000);
		},
	});

	useEffect(() => {
		let isMounted = true;
		requestPermission().then(permission => {
			if (isMounted) {
				if (!permission) {
					console.log('permission denied');
				}
			}
		});

		return () => {
			isMounted = false;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const codeScanner = useCodeScanner({
		codeTypes: ['qr'],
		onCodeScanned: codes => {
			if (isNotEmpty(codes) && isEmpty(qrCode)) {
				ReactNativeHapticFeedback.trigger('impactLight', options);

				const value = last(codes).value || '';
				setQRCode(value);

				if (value.startsWith(PREFIX_REDEEM_CODE)) {
					mutation.mutate(value);
				} else {
					Toast.show({
						type: 'error',
						text1: t('notificationTitle'),
						text2: t('redeem.code_invalid'),
					});
					setTimeout(() => {
						setQRCode('');
					}, 4000);
				}
			}
		},
	});

	const onManualInputPress = useCallback(() => {
		console.log('onManualInputPress');
		setManualInput(true);
	}, []);

	const onManualInputClose = useCallback(() => {
		setManualInput(false);
	}, []);

	const onManualInputSubmit = useCallback(
		(code: string) => {
			setManualInput(false);

			if (code.startsWith(PREFIX_REDEEM_CODE)) {
				mutation.mutate(code);
			} else {
				Toast.show({
					type: 'error',
					text1: t('notificationTitle'),
					text2: t('redeem.code_invalid'),
				});
			}
		},
		[mutation, t],
	);

	if (!cameraDevice || !hasPermission) {
		return (
			<CameraNotSupportView
				callback={() => {
					if (__DEV__) {
						mutation.mutate('VCC4DX139QSMCL5X51DSD');
					}
				}}
			/>
		);
	}

	return (
		<>
			<Camera
				style={[StyleSheet.absoluteFill]}
				device={cameraDevice}
				isActive={isActive}
				codeScanner={codeScanner}
				torch="off"
			/>
			<VoucherCustomBarcodeMask onInputPress={onManualInputPress} />
			<View style={styles.header}>
				<TouchableOpacity onPress={onGoBack} style={styles.backButton}>
					<ArrowLeftIcon />
				</TouchableOpacity>
			</View>
			{manualInput && (
				<RedeemInputDialog
					isVisible={manualInput}
					onClose={onManualInputClose}
					onSubmit={onManualInputSubmit}
				/>
			)}
			{mutation.isPending && <Loading />}
		</>
	);
};

const useStyles = makeStyles(({ colors }, { topInset }: { topInset: number }) => ({
	container: {},
	header: {
		position: 'absolute',
		left: 24,
		top: topInset + 12,
	},
	backButton: {
		padding: 8,
	},
}));

const ArrowLeftIcon = () => {
	return (
		<Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
			<Path
				fillRule="evenodd"
				clipRule="evenodd"
				d="M10.7071 5.29289C11.0976 5.68342 11.0976 6.31658 10.7071 6.70711L6.41421 11H20C20.5523 11 21 11.4477 21 12C21 12.5523 20.5523 13 20 13H6.41421L10.7071 17.2929C11.0976 17.6834 11.0976 18.3166 10.7071 18.7071C10.3166 19.0976 9.68342 19.0976 9.29289 18.7071L3.29289 12.7071C2.90237 12.3166 2.90237 11.6834 3.29289 11.2929L9.29289 5.29289C9.68342 4.90237 10.3166 4.90237 10.7071 5.29289Z"
				fill="#FFFFFF"
			/>
		</Svg>
	);
};

export default ScanVoucherCodeScreen;
