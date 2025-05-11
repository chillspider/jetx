import { BlurView } from '@react-native-community/blur';
import { useTheme } from '@rneui/themed';
import { useMemo } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

const BlurredBackground = () => {
	const {
		theme: { colors },
	} = useTheme();

	const containerStyle = useMemo(
		() => [
			styles.container,
			{
				backgroundColor: colors.background,
				opacity: 0.95,
			},
		],
		[colors.background],
	);
	return Platform.OS === 'ios' ? (
		<View style={styles.container}>
			<BlurView blurType="chromeMaterialLight" style={styles.blurView} />
		</View>
	) : (
		<View style={containerStyle} />
	);
};

const styles = StyleSheet.create({
	blurView: {
		...StyleSheet.absoluteFillObject,
	},
	container: {
		...StyleSheet.absoluteFillObject,
		borderTopLeftRadius: 10,
		borderTopRightRadius: 10,
		overflow: 'hidden',
	},
});

export default BlurredBackground;
