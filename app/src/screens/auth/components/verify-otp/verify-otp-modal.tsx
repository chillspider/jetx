import { Button, makeStyles, Text, useTheme } from '@rneui/themed';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, View } from 'react-native';
import { OtpInput } from 'react-native-otp-entry';

import { Box } from '@/components';

export const OTP_LENGTH = 6;

type Props = {
	email: string;
	isVisible: boolean;
	onClose: () => void;
	onVerify: (otp: string, email: string) => void;
};

const VerifyOtpModal: React.FC<Props> = ({ isVisible = false, onClose, onVerify, email }) => {
	const {
		theme: { colors, spacing },
	} = useTheme();

	const styles = useStyles();

	const [validate, setValidate] = useState<boolean>(false);

	const { t } = useTranslation();

	const onFilled = useCallback(
		(value: string) => {
			if (!value || value.length < OTP_LENGTH) {
				//! Error
				return;
			}

			onVerify(value, email);
			onClose();
		},
		[email, onClose, onVerify],
	);

	const onChanged = useCallback((value: string) => {
		if (!value || value.length < OTP_LENGTH) {
			setValidate(false);
		} else {
			setValidate(true);
		}
	}, []);

	return (
		<View>
			<Modal visible={isVisible} animationType="fade" onRequestClose={onClose} transparent>
				<View style={styles.modal}>
					<Box
						backgroundColor={colors.background}
						borderRadius={spacing.xl}
						justifyContent="center"
						p={16}
					>
						<Text h2 h2Style={styles.title}>
							{t('auth.verifyOtpTitle')}
						</Text>
						<Text style={styles.decs}>{t('auth.forgotPasswordOTP', { email })}</Text>
						<OtpInput
							numberOfDigits={OTP_LENGTH}
							focusColor={colors.primary}
							focusStickBlinkingDuration={500}
							onFilled={onFilled}
							onTextChange={onChanged}
							theme={{
								containerStyle: styles.inputsContainer,
								pinCodeContainerStyle: styles.pinCodeContainer,
								pinCodeTextStyle: styles.pinCodeText,
								focusStickStyle: styles.focusStick,
								focusedPinCodeContainerStyle: styles.activePinCodeContainer,
							}}
						/>
						<Box height={48} />
						<Button title={t('confirm')} disabled={!validate} />
					</Box>
				</View>
			</Modal>
		</View>
	);
};

const useStyles = makeStyles(({ colors, spacing }) => ({
	modal: {
		flex: 1,
		backgroundColor: 'rgba(0, 0, 0, 0.3)',
		justifyContent: 'center',
		alignItems: 'center',
		paddingHorizontal: 16,
	},
	inputsContainer: {},
	pinCodeContainer: {
		width: 48,
		height: 48,
	},
	pinCodeText: {
		fontSize: spacing.xl,
		fontWeight: 'bold',
	},
	focusStick: {
		backgroundColor: colors.primary,
	},
	activePinCodeContainer: {
		borderColor: colors.primary,
	},
	title: {
		textAlign: 'center',
	},
	decs: {
		marginTop: 8,
		textAlign: 'center',
		paddingBottom: 32,
	},
}));

export default VerifyOtpModal;
