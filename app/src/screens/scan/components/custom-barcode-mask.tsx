/* eslint-disable react-native/no-inline-styles */
import { Text, useTheme } from '@rneui/themed';
import React from 'react';
import { useTranslation } from 'react-i18next';

import JetX from '@/assets/svgs/jetx.svg';
import { Box } from '@/components';
import BarcodeMask from '@/components/barcode-mask/barcode-mask';

const CustomBarcodeMask: React.FC = () => {
	const {
		theme: { colors },
	} = useTheme();

	const { t } = useTranslation();

	return (
		<BarcodeMask
			backgroundColor={colors.white}
			edgeColor={colors.primary}
			animatedLineColor={colors.primary}
			bottomComponent={
				<Box px={8} py={4} borderRadius={8} backgroundColor={colors.primary100}>
					<Text body2>{t('qrDecs')}</Text>
				</Box>
			}
			topComponent={
				<Box justifyContent="center" alignItems="center" pb={12}>
					<JetX />
					<Text style={{ fontSize: 12, marginVertical: 12, color: colors.white }}>
						{t('qrTitle')}
					</Text>
				</Box>
			}
		/>
	);
};

export default CustomBarcodeMask;
