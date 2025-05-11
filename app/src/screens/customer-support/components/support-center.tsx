import { makeStyles, Text } from '@rneui/themed';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable } from 'react-native';
import Svg, { Path } from 'react-native-svg';

type Props = {
	onPress: () => void;
};

const SupportCenterView: React.FC<Props> = ({ onPress }) => {
	const styles = useStyles();
	const { t } = useTranslation();

	return (
		<Pressable style={styles.callButton} hitSlop={12} onPress={onPress}>
			<CallCenterIcon />
			<Text style={styles.callTitle}>{t('support.callCustomerService')}</Text>
		</Pressable>
	);
};

const CallCenterIcon = () => {
	return (
		<Svg width="14" height="15" viewBox="0 0 14 15" fill="none">
			<Path
				d="M6.99967 0.333332C3.32634 0.333332 0.333008 3.32667 0.333008 7V10C0.333008 10.5533 0.779675 11 1.33301 11H1.99967C2.55301 11 2.99967 10.5533 2.99967 10V8C2.99967 7.44667 2.55301 7 1.99967 7H1.66634C1.66634 4.04667 4.04634 1.66667 6.99967 1.66667C9.95301 1.66667 12.333 4.04667 12.333 7H11.9997C11.4463 7 10.9997 7.44667 10.9997 8V10C10.9997 10.5533 11.4463 11 11.9997 11H12.333C12.333 11.7467 11.7463 12.3333 10.9997 12.3333H8.15301C7.91301 11.92 7.47301 11.6667 6.99967 11.6667C6.26634 11.6667 5.66634 12.2667 5.66634 13C5.66634 13.7333 6.26634 14.3333 6.99967 14.3333C7.47301 14.3333 7.91301 14.08 8.15301 13.6667H10.9997C12.4663 13.6667 13.6663 12.4667 13.6663 11V7C13.6663 3.32667 10.673 0.333332 6.99967 0.333332Z"
				fill="#FF015C"
			/>
		</Svg>
	);
};

const useStyles = makeStyles(({ colors }) => ({
	container: {},
	callButton: {
		flexDirection: 'row',
		alignSelf: 'center',
		justifyContent: 'center',
		alignItems: 'center',
	},
	callTitle: {
		color: colors.primary,
		paddingLeft: 4,
		fontSize: 14,
	},
}));

export default SupportCenterView;
