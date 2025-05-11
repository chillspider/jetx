import { makeStyles, Text, useTheme } from '@rneui/themed';
import { isNotNil } from 'ramda';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import { Path, Svg } from 'react-native-svg';

import { Box } from '@/components';
import { VoucherDto } from '@/models/order/voucher.dto';

type Props = {
	onChange?: () => void;
	voucher?: VoucherDto;
};

const VoucherSelection: React.FC<Props> = ({ onChange, voucher }) => {
	const styles = useStyles({ selected: isNotNil(voucher) });

	const { t } = useTranslation();

	return (
		<View style={styles.container}>
			<IcVoucher selected={isNotNil(voucher)} />
			<Box flex={1} px={12} justifyContent="space-between">
				<Box flexDirection="row" justifyContent="space-between" alignItems="center">
					<Text body2>{isNotNil(voucher) ? voucher.name || '' : t('voucherTitle')}</Text>
					<Pressable onPress={onChange} hitSlop={8}>
						<Text style={styles.select}>
							{isNotNil(voucher) ? t('change') : t('selectionVoucher')}
						</Text>
					</Pressable>
				</Box>
				<Text style={styles.voucherNotSelect} numberOfLines={1} ellipsizeMode="tail">
					{isNotNil(voucher) ? voucher.description || '' : t('voucherNotSelected')}
				</Text>
			</Box>
		</View>
	);
};

type IcProps = {
	selected?: boolean;
};

const IcVoucher: React.FC<IcProps> = ({ selected = false }) => {
	const {
		theme: { colors },
	} = useTheme();

	return (
		<Box
			width={40}
			height={40}
			borderRadius={44}
			backgroundColor={colors.white}
			alignItems="center"
			justifyContent="center"
		>
			<Svg width="20" height="16" viewBox="0 0 20 16" fill="none">
				<Path
					d="M0 15C2.65169e-05 15.2652 0.105392 15.5195 0.292922 15.7071C0.480453 15.8946 0.734792 16 1 16H19C19.2652 16 19.5195 15.8946 19.7071 15.7071C19.8946 15.5195 20 15.2652 20 15V11C20 10.7348 19.8946 10.4805 19.7071 10.2929C19.5195 10.1054 19.2652 10 19 10C17.8851 10 17 9.11494 17 8C17 6.88506 17.8851 6 19 6C19.2652 5.99997 19.5195 5.89461 19.7071 5.70708C19.8946 5.51955 20 5.26521 20 5V1C20 0.734792 19.8946 0.480453 19.7071 0.292923C19.5195 0.105392 19.2652 2.67029e-05 19 0L1 0C0.734792 2.67029e-05 0.480453 0.105392 0.292922 0.292923C0.105392 0.480453 2.65169e-05 0.734792 0 1L0 5C2.65169e-05 5.26521 0.105392 5.51955 0.292922 5.70708C0.480453 5.89461 0.734792 5.99997 1 6C2.11494 6 3 6.88506 3 8C3 9.11494 2.11494 10 1 10C0.734792 10 0.480453 10.1054 0.292922 10.2929C0.105392 10.4805 2.65169e-05 10.7348 0 11L0 15ZM2 14L2 11.7969C3.70626 11.3405 5 9.84337 5 8C5 6.15663 3.70626 4.65954 2 4.20312V2H7V4C6.99813 4.13251 7.02261 4.26407 7.07202 4.38704C7.12143 4.51001 7.1948 4.62193 7.28784 4.7163C7.38088 4.81067 7.49176 4.88561 7.61401 4.93676C7.73627 4.9879 7.86748 5.01424 8 5.01424C8.13253 5.01424 8.26373 4.9879 8.38599 4.93676C8.50824 4.88561 8.61912 4.81067 8.71216 4.7163C8.8052 4.62193 8.87857 4.51001 8.92798 4.38704C8.97739 4.26407 9.00187 4.13251 9 4V2L18 2V4.20313C16.2937 4.65954 15 6.15663 15 8C15 9.84337 16.2937 11.3405 18 11.7969V14L9 14V12C9.00187 11.8675 8.97739 11.7359 8.92798 11.613C8.87857 11.49 8.8052 11.3781 8.71216 11.2837C8.61912 11.1893 8.50824 11.1144 8.38599 11.0632C8.26373 11.0121 8.13253 10.9858 8 10.9858C7.86748 10.9858 7.73627 11.0121 7.61401 11.0632C7.49176 11.1144 7.38088 11.1893 7.28784 11.2837C7.1948 11.3781 7.12143 11.49 7.07202 11.613C7.02261 11.7359 6.99813 11.8675 7 12V14H2ZM7 9C6.99813 9.13251 7.02261 9.26407 7.07202 9.38704C7.12143 9.51001 7.1948 9.62193 7.28784 9.7163C7.38088 9.81067 7.49176 9.88561 7.61401 9.93676C7.73627 9.9879 7.86748 10.0142 8 10.0142C8.13253 10.0142 8.26373 9.9879 8.38599 9.93676C8.50824 9.88561 8.61912 9.81067 8.71216 9.7163C8.8052 9.62193 8.87857 9.51001 8.92798 9.38704C8.97739 9.26407 9.00187 9.13251 9 9V7C9.00187 6.86749 8.97739 6.73593 8.92798 6.61296C8.87857 6.48999 8.8052 6.37807 8.71216 6.2837C8.61912 6.18933 8.50824 6.11439 8.38599 6.06324C8.26373 6.0121 8.13253 5.98576 8 5.98576C7.86748 5.98576 7.73627 6.0121 7.61401 6.06324C7.49176 6.11439 7.38088 6.18933 7.28784 6.2837C7.1948 6.37807 7.12143 6.48999 7.07202 6.61296C7.02261 6.73593 6.99813 6.86749 7 7L7 9Z"
					fill={selected ? colors.primary : colors.neutral800}
				/>
			</Svg>
		</Box>
	);
};

const useStyles = makeStyles(({ colors }, { selected }: { selected: boolean }) => ({
	container: {
		borderTopLeftRadius: 100,
		borderBottomLeftRadius: 100,
		backgroundColor: selected ? colors.primary50 : colors.neutral100,
		padding: 8,
		flexDirection: 'row',
		marginTop: 12,
	},
	select: {
		color: colors.blue,
		fontSize: 10,
		textDecorationLine: 'underline',
	},
	voucherNotSelect: {
		fontSize: 12,
	},
}));

export default VoucherSelection;
