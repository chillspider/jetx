import { BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Input, makeStyles, useTheme } from '@rneui/themed';
import React from 'react';
import { Controller, SubmitHandler, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { z } from 'zod';

import IcEmail from '@/assets/svgs/ic_email.svg';
import { Box } from '@/components';

const schema = z.object({
	email: z
		.string({
			required_error: 'auth.errorEmailRequired',
		})
		.email('auth.errorEmailFormat'),
});

type FormType = z.infer<typeof schema>;

type Props = {
	onConfirm?: (email: string) => void;
};

const VerifyEmailContentView: React.FC<Props> = ({ onConfirm }) => {
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
			onConfirm(data.email);
		}
	};

	return (
		<Box mt={24} px={16} flex={1} pb={bottomSafe + 16}>
			<Controller
				control={control}
				name="email"
				render={({ field: { onChange, onBlur, value } }) => (
					<Input
						placeholder={t('auth.emailPlaceholder')}
						placeholderTextColor={colors.neutral400}
						leftIcon={<IcEmail />}
						keyboardType="email-address"
						inputContainerStyle={styles.inputContainer}
						containerStyle={styles.containerStyle}
						style={styles.input}
						autoCapitalize="none"
						onBlur={onBlur}
						onChangeText={onChange}
						value={value}
						errorMessage={errors.email && t(`${errors.email.message}`, '')}
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

export default VerifyEmailContentView;
