/* eslint-disable react-native/no-inline-styles */
import { Text, useTheme } from '@rneui/themed';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { TouchableOpacity } from 'react-native';

import JetX from '@/assets/svgs/jetx.svg';
import { Box } from '@/components';
import BarcodeMask from '@/components/barcode-mask/barcode-mask';

type Props = {
	onInputPress?: () => void;
};

const VoucherCustomBarcodeMask: React.FC<Props> = ({ onInputPress }) => {
	const {
		theme: { colors },
	} = useTheme();

	const { t } = useTranslation();

	return (
		<>
			<BarcodeMask
				backgroundColor={colors.white}
				edgeColor={colors.primary}
				animatedLineColor={colors.primary}
				bottomComponent={
					<Box justifyContent="center" alignItems="center">
						<Box px={8} py={4} borderRadius={8} backgroundColor={colors.primary100}>
							<Text body2>{t('voucherQrDecs')}</Text>
						</Box>
						<Box height={8} />
						<TouchableOpacity onPress={onInputPress}>
							<Text
								style={{
									color: colors.primary,
									padding: 8,
								}}
							>
								{t('inputVoucherCode')}
							</Text>
						</TouchableOpacity>
					</Box>
				}
				topComponent={
					<Box justifyContent="center" alignItems="center" pb={12}>
						<JetX />
						<Text style={{ fontSize: 12, marginVertical: 12, color: colors.white }}>
							{t('voucherQrTitle')}
						</Text>
					</Box>
				}
			/>
		</>
	);
};

export default VoucherCustomBarcodeMask;
