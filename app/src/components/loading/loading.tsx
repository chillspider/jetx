import { makeStyles } from '@rneui/themed';
import { ActivityIndicator, Dimensions, StyleSheet, View } from 'react-native';

const { height, width } = Dimensions.get('window');

const useStyles = makeStyles(({ colors }) => ({
	loadingContainer: {
		height,
		width,
		...StyleSheet.absoluteFillObject,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: colors.white,
		opacity: 0.8,
	},
}));

const Loading = () => {
	const styles = useStyles();

	return (
		<View style={styles.loadingContainer}>
			<ActivityIndicator size="large" />
		</View>
	);
};

export default Loading;
