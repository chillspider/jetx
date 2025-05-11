import { Button, Input, makeStyles, Text, useTheme } from '@rneui/themed';
import { isNotEmpty } from 'ramda';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Box, Dialog } from '@/components';

type Props = {
	onClose?: () => void;
	onSubmit?: (code: string) => void;
	isVisible: boolean;
};

const ReferralInputDialog: React.FC<Props> = ({ onClose, onSubmit, isVisible }) => {
	const { t } = useTranslation();
	const styles = useStyles();
	const {
		theme: { colors },
	} = useTheme();

	const [inputReferral, setInputReferral] = useState<string>('');

	const validatedReferral = useMemo(() => {
		return isNotEmpty(inputReferral);
	}, [inputReferral]);

	return (
		<Dialog
			isVisible={isVisible}
			actionVisible={false}
			title={t('referral.input_title')}
			onClosed={onClose}
		>
			<View style={styles.content}>
				<Text style={styles.title}>{t('referral.invite_input_text')}</Text>
				<Box height={12} />
				<Input
					value={inputReferral}
					style={styles.input}
					inputContainerStyle={styles.inputContainer}
					containerStyle={styles.containerStyle}
					placeholder={t('referral.placeholder_referral_code')}
					errorStyle={styles.error}
					onChangeText={text => {
						setInputReferral(text);
					}}
				/>
				<Box height={20} />
				{!validatedReferral && (
					<Button
						title={t('referral.skip')}
						onPress={onClose}
						color={colors.primary50}
						titleStyle={styles.titleStyle}
					/>
				)}
				{validatedReferral && (
					<Button
						title={t('referral.confirm')}
						onPress={() => {
							onSubmit?.(inputReferral.trim());
						}}
					/>
				)}
			</View>
		</Dialog>
	);
};

const useStyles = makeStyles(({ colors }) => ({
	content: {
		width: '100%',
	},
	title: {
		fontSize: 16,
		fontWeight: '300',
		justifyContent: 'center',
		textAlign: 'center',
		paddingHorizontal: 12,
	},
	titleHighlight: {
		fontSize: 16,
		color: colors.primary,
	},
	inputContent: {
		marginTop: 20,
	},
	input: {
		color: colors.neutral800,
		fontSize: 16,
	},
	inputContainer: {
		borderWidth: 1,
		borderColor: colors.neutral200,
		borderRadius: 8,
		paddingHorizontal: 16,
		paddingVertical: 2,
		padding: 0,
		width: '100%',
	},
	containerStyle: {
		paddingHorizontal: 0,
	},
	error: {
		display: 'none',
	},

	titleStyle: { color: colors.primary, fontWeight: 'normal' },
}));

export default ReferralInputDialog;
