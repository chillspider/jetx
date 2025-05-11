import { makeStyles, Text, useTheme } from '@rneui/themed';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ColorValue, TouchableOpacity, View } from 'react-native';
import Animated, {
	interpolate,
	useAnimatedStyle,
	useSharedValue,
	withRepeat,
	withTiming,
} from 'react-native-reanimated';
import { Path, Svg } from 'react-native-svg';

import IcMember from '@/assets/svgs/ic_membership.svg';
import { Box } from '@/components';

type Props = {
	onPress?: () => void;
};

const MembershipBadgeView: React.FC<Props> = ({ onPress }) => {
	const {
		theme: { colors },
	} = useTheme();

	const styles = useStyles();

	const { t } = useTranslation();

	const translateX = useSharedValue(-6);

	translateX.value = withRepeat(withTiming(8, { duration: 1200 }), -1, true);

	const animatedStyle = useAnimatedStyle(() => {
		const opacity = interpolate(translateX.value, [-6, 8], [0.35, 1]);
		return {
			transform: [{ translateX: translateX.value }],
			opacity,
		};
	});

	return (
		<TouchableOpacity onPress={onPress}>
			<View style={styles.container}>
				<IcMember />
				<Box px={12}>
					<Text body2>{t('member.memberShipTitle')}</Text>
				</Box>
				<Animated.View style={[styles.arrow, animatedStyle]}>
					<IcArrow color={colors.yellow} />
					<IcArrow color={colors.yellow} />
				</Animated.View>
			</View>
		</TouchableOpacity>
	);
};

const IcArrow: React.FC<{ color?: ColorValue; opacity?: number | string }> = ({
	color = '#FBC02D',
	opacity = 1,
}) => {
	return (
		<Svg width="7" height="12" viewBox="0 0 7 12" fill="none" opacity={opacity}>
			<Path
				d="M1.33329 0.666687C1.67462 0.666687 2.01529 0.796687 2.27595 1.05735L6.27595 5.05735C6.79662 5.57802 6.79662 6.42202 6.27595 6.94269L2.27595 10.9427C1.75529 11.4634 0.911289 11.4634 0.390622 10.9427C-0.130045 10.422 -0.130045 9.57802 0.390622 9.05735L3.44796 6.00002L0.390622 2.94269C-0.130045 2.42202 -0.130045 1.57802 0.390622 1.05735C0.651289 0.796687 0.991955 0.666687 1.33329 0.666687Z"
				fill={color}
			/>
		</Svg>
	);
};

const useStyles = makeStyles(({ colors }) => ({
	container: {
		paddingVertical: 8,
		paddingHorizontal: 16,
		flexDirection: 'row',
		borderWidth: 1,
		borderRadius: 8,
		borderColor: colors.yellow,
		alignItems: 'center',
		backgroundColor: colors.yellow2,
		alignSelf: 'center',
	},
	arrow: {
		flexDirection: 'row',
		alignItems: 'center',
	},
}));

export default MembershipBadgeView;
