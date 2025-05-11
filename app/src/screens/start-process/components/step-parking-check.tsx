import { Button, makeStyles, Text } from '@rneui/themed';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import IcCongratulation from '@/assets/svgs/ic-congratulation.svg';
import { Box, Dialog } from '@/components';
import { useDeviceStatus } from '@/core/hooks/start-process/useDeviceStatus';
import { DeviceDto } from '@/models/devices/device.dto';
import { MachineAllowStatus } from '@/models/yigoli/allow-status.enum';
import { MachineAllowType } from '@/models/yigoli/allow-type.enum';

import DeviceParkingStatus from './device-parking-status';

const REFETCH_INTERVAL = 10000;

type Props = {
	device: DeviceDto;
	onNext?: () => void;
};

const StepParkingCheck: React.FC<Props> = ({ device, onNext }) => {
	const { data: machineInfo } = useDeviceStatus({
		variables: { id: device.id },
		refetchInterval: REFETCH_INTERVAL,
		refetchIntervalInBackground: true,
		retry: 5,
	});

	const { t } = useTranslation();

	const isAllow = useMemo(
		() => !!machineInfo && machineInfo.isAllow === MachineAllowStatus.ALLOW,
		[machineInfo],
	);

	const styles = useStyles();

	const { bottom } = useSafeAreaInsets();

	const infoStatus = useMemo(() => {
		if (isAllow) {
			return '';
		}
		switch (machineInfo?.notAllowType) {
			case MachineAllowType.OFFLINE:
				return t('process.allowType.offline');
			case MachineAllowType.FAULT:
				return t('process.allowType.fault');
			case MachineAllowType.MOVE_BACKWARD:
				return t('process.allowType.moveBackward');
			case MachineAllowType.MOVE_FORWARD:
				return t('process.allowType.moveForward');
			case MachineAllowType.WASHING:
				return t('process.allowType.washing');
			case MachineAllowType.MAINTAIN:
				return t('process.allowType.maintain');
			case MachineAllowType.STOP:
				return t('process.allowType.stop');
			case MachineAllowType.UNKNOWN:
				return t('process.allowType.unknown');
			default:
				return t('process.allowType.unknown');
		}
	}, [isAllow, machineInfo, t]);

	return (
		<View style={[styles.container]}>
			<View style={styles.content}>
				<Text h4 h4Style={styles.title}>
					{t('process.parking.title')}
				</Text>
				<Text body2 style={styles.desc}>
					{infoStatus}
				</Text>
				<Box flex={1} my={12}>
					<DeviceParkingStatus info={machineInfo} />
				</Box>
			</View>
			<View style={[styles.bottom, { paddingBottom: bottom + 16 }]}>
				<Button title={t('process.nextStep')} onPress={onNext} disabled={!isAllow} />
			</View>
			{isAllow && (
				<Dialog
					isRequired
					isVisible={isAllow}
					confirmLabel={t('process.nextStep')}
					title={t('process.parking.stop')}
					onConfirm={onNext}
				>
					<Box justifyContent="center" alignItems="center">
						<IcCongratulation />
						<Box height={12} />
						<Text>{t('process.parking.success')}</Text>
					</Box>
				</Dialog>
			)}
		</View>
	);
};

const useStyles = makeStyles(({ colors }) => ({
	container: {
		paddingTop: 24,
		flex: 1,
	},
	content: {
		flex: 1,
		paddingHorizontal: 48,
	},
	bottom: {
		backgroundColor: colors.white,
		paddingTop: 16,
	},
	title: {
		textAlign: 'center',
	},
	desc: {
		textAlign: 'center',
		fontWeight: '300',
		marginTop: 8,
		color: colors.error,
	},
	greenLine: {
		paddingVertical: 6,
		width: '100%',
		justifyContent: 'center',
		alignItems: 'center',
	},
	yellowLine: {
		paddingVertical: 6,
		width: 24,
		height: '100%',
		justifyContent: 'center',
		alignItems: 'center',
	},
}));

export default StepParkingCheck;
