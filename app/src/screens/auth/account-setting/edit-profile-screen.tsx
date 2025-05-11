/* eslint-disable react-native/no-inline-styles */
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigation } from '@react-navigation/native';
import { Button, useTheme } from '@rneui/themed';
import React from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { z } from 'zod';

import { Box, ContentWrapper, Header, ScreenWrapper } from '@/components';
import ControlledInput from '@/components/input/controlled-input';
import { useAuth } from '@/core/store/auth';
import { AppNavigationProp } from '@/types/navigation';

import { useUpdateProfile } from './hooks/useUpdateProfile';

const schema = z.object({
	firstName: z.string().optional(),
	lastName: z.string().optional(),
	phonenumber: z.string().optional(),
	email: z.string({
		required_error: '',
	}),
});

export type FormType = z.infer<typeof schema>;

const EditProfileScreen: React.FC = () => {
	const { user, getProfile } = useAuth();
	const {
		theme: { colors },
	} = useTheme();

	const { t } = useTranslation();

	const { bottom: bottomSafe } = useSafeAreaInsets();

	const { handleSubmit, control, formState } = useForm<FormType>({
		resolver: zodResolver(schema),
		defaultValues: {
			email: user?.email,
			lastName: user?.lastName ?? '',
			firstName: user?.firstName ?? '',
			phonenumber: user?.phone ?? '',
		},
	});

	const navigation = useNavigation<AppNavigationProp<'EditProfile'>>();

	const mutation = useUpdateProfile({
		onSuccess: () => {
			Toast.show({
				type: 'success',
				text1: t('notificationTitle'),
				text2: t('profile.success'),
			});

			getProfile();

			navigation.goBack();
		},
		onError: () => {
			Toast.show({
				type: 'error',
				text1: t('notificationTitle'),
				text2: t('networkError'),
			});
		},
	});

	const onSubmit: SubmitHandler<FormType> = data => {
		mutation.mutate({
			firstName: data.firstName,
			lastName: data.lastName,
			phone: data.phonenumber,
		});
	};

	return (
		<ScreenWrapper>
			<Header title={t('profile.accountManagement')} />
			<ContentWrapper>
				<KeyboardAwareScrollView style={{ paddingTop: 16 }}>
					<ControlledInput
						readOnly
						control={control}
						name="email"
						disabled
						placeholder={t('profile.email')}
						label={t('profile.email')}
					/>
					<ControlledInput
						control={control}
						name="firstName"
						placeholder={t('profile.firstNamePlaceholder')}
						label={t('profile.firstName')}
					/>
					<ControlledInput
						control={control}
						name="lastName"
						placeholder={t('profile.firstNamePlaceholder')}
						label={t('profile.fullName')}
					/>
					<ControlledInput
						control={control}
						name="phonenumber"
						keyboardType="phone-pad"
						placeholder={t('profile.phoneNumberPlaceholder')}
						label={t('profile.phoneNumber')}
					/>
				</KeyboardAwareScrollView>

				<Box pb={bottomSafe + 12} pt={12} backgroundColor={colors.white}>
					<Button
						title={t('saveChange')}
						onPress={handleSubmit(onSubmit)}
						disabled={mutation.isPending || !formState.isValid}
						loading={mutation.isPending}
					/>
				</Box>
			</ContentWrapper>
		</ScreenWrapper>
	);
};

export default EditProfileScreen;
