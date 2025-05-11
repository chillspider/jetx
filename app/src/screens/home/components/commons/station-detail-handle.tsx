import { useTheme } from '@rneui/themed';
import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import useHomeDimensions from '../../hooks/useHomeDimensions';

const LocationDetailsHandle: React.FC = () => {
	// hooks
	const {
		theme: { colors },
	} = useTheme();

	const { SCREEN_WIDTH } = useHomeDimensions();

	// styles
	const indicatorStyle = useMemo(
		() => [
			styles.indicator,
			{
				backgroundColor: colors.neutral500,
				width: (8 * SCREEN_WIDTH) / 100,
			},
		],
		[SCREEN_WIDTH, colors.neutral500],
	);

	// render
	return (
		<View style={styles.container}>
			<View style={indicatorStyle} />
		</View>
	);
};

export const styles = StyleSheet.create({
	container: {
		paddingHorizontal: 16,
		paddingVertical: 5,
	},
	indicator: {
		alignSelf: 'center',
		height: 5,
		borderRadius: 4,
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
	},
});

export default LocationDetailsHandle;
