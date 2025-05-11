import { useNavigation } from '@react-navigation/native';
import { makeStyles, Text } from '@rneui/themed';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Path, Svg } from 'react-native-svg';
import Toast from 'react-native-toast-message';

import { Box, ContentWrapper, Dialog, Header, Modal, ScreenWrapper, useModal } from '@/components';
import { Loading } from '@/components/loading';
import { useRefreshOnFocus } from '@/core/hooks/useRefreshOnFocus';
import { signOut, useAuth } from '@/core/store/auth';
import { UserStatus } from '@/models/auth/enums/auth-provider.enum';
import { AppNavigationProp } from '@/types/navigation';

import ChangePasswordView from '../components/change-password/change-password';
import AccountInfoView from './components/account-info-view';
import AccountSettingItem from './components/account-setting-item';
import { useVerifyEmail } from './hooks/useEmail';

const AccountSettingScreen: React.FC = () => {
	const { t } = useTranslation();

	const navigation = useNavigation<AppNavigationProp<'Account'>>();

	const { bottom } = useSafeAreaInsets();

	const changePasswordModal = useModal();
	const styles = useStyles();

	const { updatePassword, deleteProfile, user, getProfile } = useAuth();

	const [showConfirmDelete, setConfirmDelete] = useState<boolean>(false);
	const [showVerifyEmailDialog, setShowVerifyEmailDialog] = useState<boolean>(false);

	const { mutate: verifyEmail, isPending } = useVerifyEmail({
		onSuccess: () => {
			setShowVerifyEmailDialog(true);
		},
		onError: () => {
			Toast.show({
				type: 'error',
				text1: t('error'),
				text2: t('networkError'),
			});
		},
	});

	useEffect(() => {
		getProfile();
	}, [getProfile]);

	useRefreshOnFocus(getProfile);

	const onVerifyEmail = useCallback(() => {
		verifyEmail({ variables: {} });
	}, [verifyEmail]);

	const isUserInactive = useMemo(() => {
		return user?.status === UserStatus.INACTIVE;
	}, [user]);

	const confirmDeleteAccount = useCallback(() => {
		setConfirmDelete(true);
	}, []);

	const closeDialogDeleteAccount = useCallback(() => {
		setConfirmDelete(false);
	}, []);

	const openChangePasswordModal = useCallback(() => {
		changePasswordModal.present();
	}, [changePasswordModal]);

	const onConfirmDeleteAcc = useCallback(async () => {
		closeDialogDeleteAccount();

		const result = await deleteProfile();

		if (result) {
			signOut();
		} else {
			Toast.show({
				type: 'error',
				text1: t('error'),
				text2: t('networkError'),
			});
		}
	}, [closeDialogDeleteAccount, deleteProfile, t]);

	const onConfirmVerifyEmail = useCallback(() => {
		setShowVerifyEmailDialog(false);
	}, []);

	const onConfirmChangePassword = useCallback(
		async (oldPassword: string, password: string) => {
			changePasswordModal.dismiss();
			const result = await updatePassword(password, oldPassword);
			if (result) {
				signOut();
				Toast.show({
					type: 'success',
					text1: t('notificationTitle'),
					text2: t('auth.changePasswordSuccessful'),
				});
			} else {
				Toast.show({
					type: 'error',
					text1: t('error'),
					text2: t('networkError'),
				});
			}
		},
		[changePasswordModal, t, updatePassword],
	);

	const navigateEditProfile = useCallback(() => {
		navigation.navigate('EditProfile');
	}, [navigation]);

	return (
		<ScreenWrapper>
			<Header
				title={t('profile.accountManagement')}
				rightComponent={
					<Pressable hitSlop={8} onPress={navigateEditProfile}>
						<IconEdit />
					</Pressable>
				}
			/>
			<ContentWrapper pb={bottom > 0 ? bottom : 16}>
				<Box flex={1}>
					<AccountInfoView />
					{isUserInactive && (
						<TouchableOpacity onPress={onVerifyEmail}>
							<Box pt={24} hitSlop={8}>
								<Text style={styles.inactiveWarning}>
									{t('auth.inactiveWarning')}{' '}
									<Text style={styles.reverifyButton}>{t('auth.reverifyButton')}</Text>
								</Text>
							</Box>
						</TouchableOpacity>
					)}
				</Box>
				<AccountSettingItem title={t('auth.changePassword')} onPress={openChangePasswordModal} />
				<AccountSettingItem isDanger title={t('auth.logout')} onPress={signOut} />
				<AccountSettingItem
					isDanger
					title={t('auth.deleteAccount')}
					onPress={confirmDeleteAccount}
				/>
			</ContentWrapper>

			<Dialog
				isVisible={showConfirmDelete}
				title={t('auth.deleteAccount')}
				description={t('auth.deleteAccountDecs')}
				onClosed={closeDialogDeleteAccount}
				onConfirm={onConfirmDeleteAcc}
			/>

			<Dialog
				isVisible={showVerifyEmailDialog}
				title={t('auth.verifyEmail')}
				description={t('auth.verifyEmailDecs', { email: user?.email })}
				onClosed={onConfirmVerifyEmail}
				onConfirm={onConfirmVerifyEmail}
				confirmLabel={t('know')}
				isRequired
			/>

			<Modal
				ref={changePasswordModal.ref}
				title={t('auth.changePassword')}
				keyboardBehavior="extend"
			>
				<ChangePasswordView onConfirm={onConfirmChangePassword} />
			</Modal>
			{isPending && <Loading />}
		</ScreenWrapper>
	);
};

const IconEdit = () => {
	return (
		<Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
			<Path
				d="M13.5156 1.99994C13.3711 1.998 13.2871 2.0058 13.2871 2.0058C13.1388 2.01785 12.995 2.06285 12.8663 2.13752C12.7375 2.2122 12.6271 2.31466 12.543 2.43744L3.40234 15.7519C3.29988 15.901 3.2398 16.0752 3.22851 16.2558L3.00195 19.9394C2.99139 20.1118 3.02565 20.284 3.1014 20.4392C3.17714 20.5944 3.29179 20.7273 3.43418 20.8251C3.57656 20.9228 3.74183 20.982 3.91389 20.9969C4.08596 21.0118 4.25894 20.9819 4.41601 20.9101L7.77148 19.3749C7.93617 19.2994 8.07727 19.1806 8.17969 19.0312L17.3223 5.71869C17.4065 5.59563 17.4621 5.45529 17.4851 5.30795C17.5081 5.16061 17.4978 5.01 17.4551 4.86713C17.4551 4.86713 17.087 3.57879 15.8555 2.73237C14.9311 2.09708 13.9491 2.00576 13.5156 1.99994ZM13.8184 4.11127C14.0502 4.12512 14.2905 4.0838 14.7227 4.3808C15.1542 4.67739 15.2038 4.91481 15.3008 5.1269L14.5098 6.27729L13.0293 5.25971L13.8184 4.11127ZM11.8984 6.9101L13.3789 7.92572L6.68945 17.6718L5.09961 18.3964L5.20703 16.6562L11.8984 6.9101ZM11 18.9999C10.7348 18.9999 10.4804 19.1053 10.2929 19.2928C10.1054 19.4804 10 19.7347 10 19.9999C10 20.2652 10.1054 20.5195 10.2929 20.7071C10.4804 20.8946 10.7348 20.9999 11 20.9999C11.2652 20.9999 11.5196 20.8946 11.7071 20.7071C11.8946 20.5195 12 20.2652 12 19.9999C12 19.7347 11.8946 19.4804 11.7071 19.2928C11.5196 19.1053 11.2652 18.9999 11 18.9999ZM15 18.9999C14.7348 18.9999 14.4804 19.1053 14.2929 19.2928C14.1054 19.4804 14 19.7347 14 19.9999C14 20.2652 14.1054 20.5195 14.2929 20.7071C14.4804 20.8946 14.7348 20.9999 15 20.9999C15.2652 20.9999 15.5196 20.8946 15.7071 20.7071C15.8946 20.5195 16 20.2652 16 19.9999C16 19.7347 15.8946 19.4804 15.7071 19.2928C15.5196 19.1053 15.2652 18.9999 15 18.9999ZM19 18.9999C18.7348 18.9999 18.4804 19.1053 18.2929 19.2928C18.1054 19.4804 18 19.7347 18 19.9999C18 20.2652 18.1054 20.5195 18.2929 20.7071C18.4804 20.8946 18.7348 20.9999 19 20.9999C19.2652 20.9999 19.5196 20.8946 19.7071 20.7071C19.8946 20.5195 20 20.2652 20 19.9999C20 19.7347 19.8946 19.4804 19.7071 19.2928C19.5196 19.1053 19.2652 18.9999 19 18.9999Z"
				fill="#111214"
			/>
		</Svg>
	);
};

const useStyles = makeStyles(({ colors }) => ({
	inactiveWarning: {
		color: colors.red,
		fontSize: 14,
	},
	reverifyButton: {
		color: colors.blue,
		fontSize: 14,
	},
}));

export default AccountSettingScreen;
