/* eslint-disable @typescript-eslint/no-require-imports */
import { makeStyles, Text } from '@rneui/themed';
import LottieView from 'lottie-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Dimensions, View } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ANIMATION_WIDTH = SCREEN_WIDTH / 2 > 220 ? SCREEN_WIDTH / 2 : 220;

const WashWarningView: React.FC = () => {
	const styles = useStyles();

	const { t } = useTranslation();

	return (
		<View style={styles.container}>
			<LottieView
				style={styles.successView}
				autoPlay
				loop={false}
				source={require('@/assets/json/warning.json')}
			/>
			<View style={styles.noti}>
				<Text style={styles.notiText}>{t('process.canceled')}</Text>
			</View>
		</View>
	);
};

const useStyles = makeStyles(({ colors }) => ({
	container: {
		justifyContent: 'center',
		alignItems: 'center',
	},
	successView: {
		width: ANIMATION_WIDTH,
		height: ANIMATION_WIDTH,
	},
	noti: {
		backgroundColor: colors.primary400,
		borderRadius: 8,
		paddingHorizontal: 16,
		paddingVertical: 8,
		marginTop: 24,
	},
	notiText: {
		color: colors.white,
	},
}));

export default WashWarningView;
