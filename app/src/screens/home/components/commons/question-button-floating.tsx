import { makeStyles, Text, useTheme } from '@rneui/themed';
import React, { useMemo } from 'react';
import { Pressable, View } from 'react-native';
import Animated, {
	Extrapolation,
	interpolate,
	SharedValue,
	useAnimatedStyle,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import IcNotification from '@/assets/svgs/ic_notification.svg';
import { Box } from '@/components';
import { useNotificationContext } from '@/core/contexts/notification-context';

interface Props {
	animatedIndex: SharedValue<number>;
	onPress?: () => void;
}

const CIRCLE_FOCUS_HEIGHT = 48;

const NotificationButtonFloating: React.FC<Props> = ({ animatedIndex, onPress }) => {
	const {
		theme: { colors },
	} = useTheme();

	const styles = useStyles();

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
		[containerAnimatedStyle, styles.container],
	);

	const { totalUnread } = useNotificationContext();

	const totalUnreadText = useMemo(() => {
		if (totalUnread > 9) {
			return '9+';
		}
		return totalUnread;
	}, [totalUnread]);

	return (
		<Animated.View style={[containerStyle, { top: top + CIRCLE_FOCUS_HEIGHT + 32 }]}>
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
					<View style={styles.notificationIcon}>
						<IcNotification />
						{totalUnread > 0 && (
							<View style={styles.badge}>
								<Text style={styles.totalUnread}>{totalUnreadText}</Text>
							</View>
						)}
					</View>
				</Box>
			</Pressable>
		</Animated.View>
	);
};

const useStyles = makeStyles(({ colors }) => ({
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
	notificationIcon: {
		width: 24,
		height: 24,
	},
	badge: {
		position: 'absolute',
		right: -4,
		top: -4,
		backgroundColor: colors.red,
		borderRadius: 8,
		width: 16,
		height: 16,
		justifyContent: 'center',
		alignItems: 'center',
	},
	totalUnread: {
		color: colors.white,
		fontSize: 8,
	},
}));

export default NotificationButtonFloating;
