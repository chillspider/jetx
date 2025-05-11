import { useTheme } from '@rneui/themed';
import React, { useMemo } from 'react';
import { Dimensions, Pressable, StyleSheet } from 'react-native';
import Animated, {
	Extrapolation,
	interpolate,
	SharedValue,
	useAnimatedStyle,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import IcMyLocation from '@/assets/svgs/ic-my-location.svg';
import { Box } from '@/components';

import useHomeDimensions from '../../hooks/useHomeDimensions';

interface WeatherProps {
	animatedPosition: SharedValue<number>;
	animatedIndex: SharedValue<number>;
	onPress?: () => void;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const CIRCLE_FOCUS_HEIGHT = 48;

const MyLocationView: React.FC<WeatherProps> = ({ animatedIndex, animatedPosition, onPress }) => {
	// hooks
	const {
		theme: { colors },
	} = useTheme();

	const { bottom: bottomSafeArea } = useSafeAreaInsets();
	const { SEARCH_HANDLE_HEIGHT, LOCATION_DETAILS_HEIGHT } = useHomeDimensions();

	// styles
	const lockedYPosition = useMemo(
		() => SCREEN_HEIGHT - SEARCH_HANDLE_HEIGHT - LOCATION_DETAILS_HEIGHT - bottomSafeArea,
		[LOCATION_DETAILS_HEIGHT, SEARCH_HANDLE_HEIGHT, bottomSafeArea],
	);

	const containerAnimatedStyle = useAnimatedStyle(
		() => ({
			transform: [
				{
					translateY:
						animatedPosition.value > lockedYPosition
							? animatedPosition.value - CIRCLE_FOCUS_HEIGHT - 12
							: lockedYPosition - CIRCLE_FOCUS_HEIGHT - 12,
				},
				{
					scale: interpolate(animatedIndex.value, [1, 1.25], [1, 0], Extrapolation.CLAMP),
				},
			],
		}),
		[lockedYPosition],
	);

	const containerStyle = useMemo(
		() => [styles.container, containerAnimatedStyle],

		[containerAnimatedStyle],
	);

	return (
		<Animated.View style={containerStyle}>
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
					<IcMyLocation />
				</Box>
			</Pressable>
		</Animated.View>
	);
};

const styles = StyleSheet.create({
	container: {
		position: 'absolute',
		right: 12,
		top: 0,
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

export default MyLocationView;
