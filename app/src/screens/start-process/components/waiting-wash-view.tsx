/* eslint-disable react-native/no-inline-styles */
import { Text, useTheme } from '@rneui/themed';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Box } from '@/components';

const WaitingView: React.FC = () => {
	const { t } = useTranslation();
	const {
		theme: { colors },
	} = useTheme();

	return (
		<View style={{ justifyContent: 'center', alignItems: 'center', marginTop: 60 }}>
			<Text h3 h3Style={{ color: colors.white }}>
				{t('process.waiting_title')}
			</Text>
			<Box height={12} />
			<Text body2 style={{ color: colors.white }}>
				{t('process.will_start_now')}
			</Text>
		</View>
	);
};

export default WaitingView;
