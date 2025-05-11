import { makeStyles, Text } from '@rneui/themed';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {
	Easing,
	interpolate,
	useAnimatedStyle,
	useSharedValue,
	withRepeat,
	withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import Car from '@/assets/svgs/main_car.svg';
import { Box } from '@/components';
import { MachineAllowType } from '@/models/yigoli/allow-type.enum';
import { MachineInfoDto } from '@/models/yigoli/machine-info.dto';

type Props = {
	info?: MachineInfoDto;
};

const DeviceParkingStatus: React.FC<Props> = ({ info }) => {
	const { t } = useTranslation();

	const styles = useStyles();

	const needMoveForward = useMemo(() => {
		return info?.notAllowType === MachineAllowType.MOVE_FORWARD;
	}, [info?.notAllowType]);

	const needMoveBack = useMemo(() => {
		return info?.notAllowType === MachineAllowType.MOVE_BACKWARD;
	}, [info?.notAllowType]);

	const bodyNotStraight = useMemo(() => {
		return info?.notAllowType === MachineAllowType.BODY_NOT_STRAIGHT;
	}, [info?.notAllowType]);

	return (
		<Animated.View style={styles.container}>
			{needMoveForward && <StopGreenLine />}
			<Box flexDirection="row" flex={1}>
				<CrossLine />
				<Box flex={1} alignItems="center" justifyContent="center">
					<Box justifyContent="center" alignItems="center" py={16}>
						{needMoveForward && <ForwardArrow />}
						<Box flex={1} justifyContent="center">
							<CarView bodyNotStraight={bodyNotStraight} />
						</Box>
						{needMoveBack && <BackArrow />}
					</Box>
				</Box>
				<CrossLine />
			</Box>
			{needMoveBack && <StopGreenLine />}
			<Box pt={12} justifyContent="center" alignItems="center">
				<Text body2 style={styles.desc}>
					{t('process.parking.parkYellowLine')}
				</Text>
			</Box>
		</Animated.View>
	);
};

const CrossLine = () => {
	const styles = useStyles();

	return <LinearGradient colors={['white', '#FFDD00', 'white']} style={styles.yellowLine} />;
};

const ForwardArrow: React.FC = () => {
	const translateY = useSharedValue(-8);

	translateY.value = withRepeat(withTiming(6, { duration: 1000 }), -1, true);

	const animatedStyle = useAnimatedStyle(() => {
		const opacity = interpolate(translateY.value, [-6, 6], [1, 0.5]);
		return {
			transform: [{ translateY: translateY.value }],
			opacity,
		};
	});

	return (
		<Animated.View style={animatedStyle}>
			<Svg width="40" height="44" viewBox="0 0 40 44" fill="none">
				<Path
					d="M18.5859 0.586002L0.585889 18.586C0.0138891 19.158 -0.158111 20.018 0.151889 20.766C0.459889 21.514 1.19189 22 1.99989 22L11.9999 22L11.9999 42C11.9999 43.106 12.8939 44 13.9999 44L25.9999 44C27.1059 44 27.9999 43.106 27.9999 42L27.9999 22L37.9999 22C38.8079 22 39.5399 21.514 39.8479 20.766C39.9519 20.518 39.9999 20.258 39.9999 20C39.9999 19.48 39.7959 18.968 39.4139 18.586L21.4139 0.586001C20.6319 -0.196 19.3679 -0.196 18.5859 0.586002Z"
					fill="#4CAF50"
				/>
			</Svg>
		</Animated.View>
	);
};

const BackArrow: React.FC = () => {
	const translateY = useSharedValue(-6);

	translateY.value = withRepeat(withTiming(8, { duration: 1000 }), -1, true);

	const animatedStyle = useAnimatedStyle(() => {
		const opacity = interpolate(translateY.value, [-6, 8], [0.5, 1]);
		return {
			transform: [{ translateY: translateY.value }],
			opacity,
		};
	});

	return (
		<Animated.View style={animatedStyle}>
			<Svg width="40" height="44" viewBox="0 0 40 44" fill="none">
				<Path
					d="M21.414 43.414L39.414 25.414C39.986 24.842 40.158 23.982 39.848 23.234C39.54 22.486 38.808 22 38 22L28 22L28 2C28 0.893999 27.106 -5.63631e-07 26 -6.11976e-07L14 -1.13651e-06C12.894 -1.18486e-06 12 0.893999 12 2L12 22L1.99998 22C1.19198 22 0.459983 22.486 0.151983 23.234C0.0479832 23.482 -1.72503e-05 23.742 -1.72616e-05 24C-1.72843e-05 24.52 0.203981 25.032 0.585981 25.414L18.586 43.414C19.368 44.196 20.632 44.196 21.414 43.414Z"
					fill="#4CAF50"
				/>
			</Svg>
		</Animated.View>
	);
};

type CarProps = {
	bodyNotStraight: boolean;
};

const CarView: React.FC<CarProps> = ({ bodyNotStraight }) => {
	const styles = useStyles();
	const warningScale = useSharedValue(0);
	warningScale.value = withRepeat(
		withTiming(3, {
			duration: 1200,
			easing: Easing.out(Easing.ease),
		}),
		-1,
		false,
	);
	const animatedWarningStyle = useAnimatedStyle(() => {
		return {
			transform: [{ scale: warningScale.value }],
			opacity: bodyNotStraight ? 1 - warningScale.value / 3 : 0,
		};
	});

	const warningScale2 = useSharedValue(0);
	warningScale2.value = withRepeat(
		withTiming(2, {
			duration: 1000,
			easing: Easing.out(Easing.ease),
		}),
		-1,
		false,
	);
	const animatedWarningStyle2 = useAnimatedStyle(() => {
		return {
			transform: [{ scale: warningScale2.value }],
			opacity: bodyNotStraight ? 1 - warningScale2.value / 2 : 0,
		};
	});

	return (
		<View style={[styles.car, { transform: [{ rotate: bodyNotStraight ? '320deg' : '0deg' }] }]}>
			<Car />
			<Animated.View style={[styles.waringCar, animatedWarningStyle]} />
			<Animated.View style={[styles.waringCar, animatedWarningStyle2]} />
		</View>
	);
};

const StopGreenLine: React.FC = () => {
	const { t } = useTranslation();

	const styles = useStyles();

	return (
		<LinearGradient
			colors={['white', '#4CAF50', '#4CAF50', 'white']}
			style={styles.greenLine}
			start={{ x: 0, y: 0 }}
			end={{ x: 1, y: 0 }}
		>
			<Text style={styles.textStop}>{t('process.parking.stopHere')}</Text>
		</LinearGradient>
	);
};

const useStyles = makeStyles(({ colors }) => ({
	container: {
		flex: 1,
	},
	desc: {
		// textAlign: 'center',
		fontWeight: '300',
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
	textStop: {
		fontSize: 14,
		color: colors.white,
	},
	car: {
		justifyContent: 'center',
	},
	waringCar: {
		position: 'absolute',
		bottom: 0,
		right: 7,
		width: 28,
		height: 28,
		borderRadius: 14,
		backgroundColor: colors.red,
	},
}));

export default DeviceParkingStatus;
