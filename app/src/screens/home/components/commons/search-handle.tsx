import { BottomSheetHandleProps } from '@gorhom/bottom-sheet';
import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import useHomeDimensions from '../../hooks/useHomeDimensions';

interface SearchHandleProps extends BottomSheetHandleProps {
	initialValue?: string;
	onChange?: (text: string) => void;
}

const SearchHandleComponent = ({ initialValue = '', onChange }: SearchHandleProps) => {
	const { SCREEN_WIDTH } = useHomeDimensions();

	return (
		<View style={styles.container}>
			<View style={[styles.indicator, { width: (8 * SCREEN_WIDTH) / 100 }]} />
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
		backgroundColor: 'gray',
	},
});

export const SearchHandle = memo(SearchHandleComponent);
