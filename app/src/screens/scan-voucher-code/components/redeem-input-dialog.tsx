/* eslint-disable react-native/no-inline-styles */
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

export const PREFIX_REDEEM_CODE = 'VCC';

const RedeemInputDialog: React.FC<Props> = ({ onClose, onSubmit, isVisible }) => {
	const { t } = useTranslation();
	const styles = useStyles();
	const {
		theme: { colors },
	} = useTheme();

	const [inputRedeem, setInputRedeem] = useState<string>('');

	const validatedRedeem = useMemo(() => {
		return isNotEmpty(inputRedeem) && inputRedeem.toUpperCase().startsWith(PREFIX_REDEEM_CODE);
	}, [inputRedeem]);

	const invalidRedeem = useMemo(() => {
		return isNotEmpty(inputRedeem) && !inputRedeem.toUpperCase().startsWith(PREFIX_REDEEM_CODE);
	}, [inputRedeem]);

	return (
		<Dialog
			isVisible={isVisible}
			actionVisible={false}
			title={t('redeem.input_title')}
			onClosed={onClose}
		>
			<View style={styles.content}>
				<Input
					value={inputRedeem}
					style={styles.input}
					inputContainerStyle={styles.inputContainer}
					containerStyle={styles.containerStyle}
					placeholder={t('redeem.placeholder_code')}
					errorStyle={styles.error}
					autoCapitalize="characters"
					onChangeText={text => {
						setInputRedeem(text);
					}}
				/>
				{invalidRedeem && (
					<Box justifyContent="center" alignItems="center" pt={8}>
						<Text
							style={{
								color: colors.red,
								fontSize: 12,
							}}
						>
							{t('redeem.code_invalid_check')}
						</Text>
					</Box>
				)}
				<Box height={20} />
				{!validatedRedeem && (
					<Button
						title={t('redeem.skip')}
						onPress={onClose}
						color={colors.primary50}
						titleStyle={styles.titleStyle}
					/>
				)}
				{validatedRedeem && (
					<Button
						title={t('redeem.confirm')}
						onPress={() => {
							onSubmit?.(inputRedeem.trim().toUpperCase());
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

export default RedeemInputDialog;
