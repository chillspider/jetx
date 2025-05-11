import { useTheme } from '@rneui/themed';
import React, { useMemo } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, {
	Extrapolation,
	interpolate,
	SharedValue,
	useAnimatedStyle,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import IcSupport from '@/assets/svgs/ic-call-center.svg';
import { Box } from '@/components';

interface Props {
	animatedIndex: SharedValue<number>;
	onPress?: () => void;
}

const CIRCLE_FOCUS_HEIGHT = 48;

const CallCenterButtonFloating: React.FC<Props> = ({ animatedIndex, onPress }) => {
	// hooks
	const {
		theme: { colors },
	} = useTheme();

	const { top } = useSafeAreaInsets();

	const containerAnimatedStyle = useAnimatedStyle(
		() => ({
			transform: [
				{
					scale: interpolate(animatedIndex.value, [1, 1.25], [1, 0], Extrapolation.CLAMP),
				},
			],
			opacity: interpolate(animatedIndex.value, [1, 1.25], [1, 0], Extrapolation.CLAMP),
		}),
		[],
	);

	const containerStyle = useMemo(
		() => [styles.container, containerAnimatedStyle],

		[containerAnimatedStyle],
	);

	return (
		<Animated.View style={[containerStyle, { top: top + 16 }]}>
			<Pressable onPress={onPress}>
				<Box
					width={CIRCLE_FOCUS_HEIGHT}
					height={CIRCLE_FOCUS_HEIGHT}
					borderRadius={40}
					backgroundColor={colors.white}
					justifyContent="center"
					alignItems="center"
					style={styles.shadow}
				>
					<IcSupport />
				</Box>
			</Pressable>
		</Animated.View>
	);
};

const styles = StyleSheet.create({
	container: {
		position: 'absolute',
		right: 12,
		padding: 0,
		marginTop: 0,
	},
	shadow: {
		shadowColor: '#000',
		shadowOffset: {
			width: 0,
			height: 2,
		},
		shadowOpacity: 0.23,
		shadowRadius: 2.62,
		elevation: 4,
	},
});

export default CallCenterButtonFloating;
