import { BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Input, makeStyles, useTheme } from '@rneui/themed';
import React, { useState } from 'react';
import { Controller, SubmitHandler, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { z } from 'zod';

import IcEye from '@/assets/svgs/ic_eye.svg';
import IcEyeInvisible from '@/assets/svgs/ic_eye_invisible.svg';
import IcPassword from '@/assets/svgs/ic_password.svg';
import { Box } from '@/components';

const schema = z
	.object({
		password: z
			.string({ required_error: 'auth.errorPasswordRequired' })
			.min(6, 'auth.errorPasswordFormat'),
		verifyPassword: z
			.string({ required_error: 'auth.errorPasswordRequired' })
			.min(6, 'auth.errorPasswordFormat'),
	})
	.refine(data => data.password === data.verifyPassword, {
		path: ['verifyPassword'],
		message: 'auth.passwordMustMatch',
	});

type FormType = z.infer<typeof schema>;

type Props = {
	onConfirm?: (password: string) => void;
};

const ResetPasswordView: React.FC<Props> = ({ onConfirm }) => {
	const [secureText, setSecureText] = useState<boolean>(true);
	const [secureText2, setSecureText2] = useState<boolean>(true);

	const styles = useStyles();

	const { bottom: bottomSafe } = useSafeAreaInsets();

	const {
		theme: { colors },
	} = useTheme();

	const { t } = useTranslation();

	const {
		handleSubmit,
		control,
		formState: { errors },
	} = useForm<FormType>({
		resolver: zodResolver(schema),
	});

	const onSubmit: SubmitHandler<FormType> = data => {
		if (onConfirm) {
			onConfirm(data.password);
		}
	};

	return (
		<Box mt={24} px={16} flex={1} pb={bottomSafe + 16}>
			<Controller
				control={control}
				name="password"
				render={({ field: { onChange, onBlur, value } }) => (
					<Input
						placeholder={t('auth.passwordPlaceholder')}
						placeholderTextColor={colors.neutral400}
						leftIcon={<IcPassword />}
						inputContainerStyle={styles.inputContainer}
						style={styles.input}
						containerStyle={styles.containerStyle}
						secureTextEntry={secureText}
						rightIcon={
							<Pressable
								onPress={() => {
									setSecureText(!secureText);
								}}
							>
								{secureText ? (
									<IcEyeInvisible width={20} height={20} />
								) : (
									<IcEye width={20} height={20} />
								)}
							</Pressable>
						}
						onBlur={onBlur}
						onChangeText={onChange}
						value={value}
						errorMessage={errors.password && t(`${errors.password.message}`, '')}
						InputComponent={BottomSheetTextInput}
					/>
				)}
				defaultValue=""
			/>
			<Controller
				control={control}
				name="verifyPassword"
				render={({ field: { onChange, onBlur, value } }) => (
					<Input
						placeholder={t('auth.verifyPasswordHolder')}
						placeholderTextColor={colors.neutral400}
						leftIcon={<IcPassword />}
						inputContainerStyle={styles.inputContainer}
						style={styles.input}
						containerStyle={styles.containerStyle}
						secureTextEntry={secureText2}
						rightIcon={
							<Pressable
								onPress={() => {
									setSecureText2(!secureText2);
								}}
							>
								{secureText2 ? (
									<IcEyeInvisible width={20} height={20} />
								) : (
									<IcEye width={20} height={20} />
								)}
							</Pressable>
						}
						onBlur={onBlur}
						onChangeText={onChange}
						value={value}
						errorMessage={errors.verifyPassword && t(`${errors.verifyPassword.message}`, '')}
						InputComponent={BottomSheetTextInput}
					/>
				)}
				defaultValue=""
			/>
			<Box flex={1} />
			<Button onPress={handleSubmit(onSubmit)} title={t('confirm')} />
		</Box>
	);
};

const useStyles = makeStyles(({ colors }) => ({
	loginDesc: {
		fontSize: 14,
	},
	inputContainer: {
		borderWidth: 1,
		borderColor: colors.neutral200,
		borderRadius: 8,
		paddingHorizontal: 16,
		paddingVertical: 2,
		padding: 0,
	},
	containerStyle: {
		paddingHorizontal: 0,
	},
	input: {
		color: colors.neutral800,
		fontSize: 16,
	},
}));

export default ResetPasswordView;
