import { useIsFocused, useNavigation } from '@react-navigation/native';
import { isEmpty, isNotEmpty, last } from 'ramda';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import Toast from 'react-native-toast-message';
import {
	Camera,
	useCameraDevice,
	useCameraPermission,
	useCodeScanner,
} from 'react-native-vision-camera';

import { Loading } from '@/components/loading';
import { useDevice } from '@/core/hooks/useDevices';
import { useIsForeground } from '@/core/hooks/useIsForeground';
import { useRedeemCode } from '@/core/hooks/useVouchers';
import { DeviceStatusEnum } from '@/models/devices/device-status.enum';
import { AppNavigationProp } from '@/types/navigation';

import { PREFIX_REDEEM_CODE } from '../scan-voucher-code/components/redeem-input-dialog';
import CameraNotSupportView from './components/camera-not-support-view';
import CustomBarcodeMask from './components/custom-barcode-mask';

const options = {
	enableVibrateFallback: true,
	ignoreAndroidSystemSettings: false,
};

const ScanQRScreen: React.FC = () => {
	const cameraDevice = useCameraDevice('back');
	const { hasPermission, requestPermission } = useCameraPermission();
	const [qrCode, setQRCode] = useState<string>('');

	const navigation = useNavigation<AppNavigationProp<'MainTab'>>();

	//
	const isFocused = useIsFocused();
	const isForeground = useIsForeground();
	const isActive = isFocused && isForeground;

	const { t } = useTranslation();

	const mutation = useDevice({
		onError: data => {
			console.log(`Error: ${JSON.stringify(data)}`);
			Toast.show({
				type: 'error',
				text1: t('notificationTitle'),
				text2: t('networkError'),
			});
		},
		onSuccess: data => {
			if (data.status === DeviceStatusEnum.AVAILABLE) {
				navigation.navigate('StartProcess', { device: data });
			} else {
				Toast.show({
					type: 'error',
					text1: t('notificationTitle'),
					text2:
						data.status === DeviceStatusEnum.PROCESSING
							? t('device.error.processing')
							: t('device.error.unavailable'),
				});
			}
		},
		onSettled: () => {
			setTimeout(() => {
				setQRCode('');
			}, 2000);
		},
	});

	const mutationRedeemCode = useRedeemCode({
		onSuccess: () => {
			Toast.show({
				type: 'success',
				text1: t('notificationTitle'),
				text2: t('redeem.code_success'),
			});
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
					console.log('');
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
					mutationRedeemCode.mutate(value);
				} else {
					mutation.mutate({ id: value });
				}
			}
		},
	});

	if (!cameraDevice || !hasPermission) {
		return (
			<CameraNotSupportView
				callback={() => {
					if (__DEV__) {
						mutation.mutate({ id: 'fe236edc-ab97-4fc8-9142-303a2872e943' });
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
			<CustomBarcodeMask />
			{(mutation.isPending || mutationRedeemCode.isPending) && <Loading />}
		</>
	);
};

export default ScanQRScreen;
