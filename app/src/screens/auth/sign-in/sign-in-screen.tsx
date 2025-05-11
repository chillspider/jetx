import { zodResolver } from '@hookform/resolvers/zod';
import { Button, CheckBox, Input, makeStyles, Text, useTheme } from '@rneui/themed';
import React, { useCallback, useMemo, useState } from 'react';
import { Controller, SubmitHandler, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import {
	Image,
	Keyboard,
	Platform,
	Pressable,
	TouchableOpacity,
	TouchableWithoutFeedback,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import * as z from 'zod';

import AppLogo from '@/assets/images/app-logo.png';
import IcEmail from '@/assets/svgs/ic_email.svg';
import IcEye from '@/assets/svgs/ic_eye.svg';
import IcEyeInvisible from '@/assets/svgs/ic_eye_invisible.svg';
import IcPassword from '@/assets/svgs/ic_password.svg';
import { Box, Dialog, Modal, useModal } from '@/components';
import { Loading } from '@/components/loading';
import { useAuth } from '@/core/store/auth';
import { getSavedUser } from '@/core/store/auth/utils';
import { AuthProvider } from '@/models/auth/enums/auth-provider.enum';
import { LoginDto } from '@/models/auth/request/login.dto';
import InformationView from '@/screens/profile/components/information-view';

import VerifyEmailContentView from '../components/forgot-password/verify-email-view';
import ResetPasswordView from '../components/reset-password/reset-password';
import SocialButton from '../components/social-button';
import VerifyOtpModal from '../components/verify-otp/verify-otp-modal';

const schema = z.object({
	email: z
		.string({
			required_error: 'auth.errorEmailRequired',
		})
		.email('auth.errorEmailFormat'),
	password: z
		.string({ required_error: 'auth.errorPasswordRequired' })
		.min(6, 'auth.errorPasswordFormat'),
});

export type FormType = z.infer<typeof schema>;

const SignInScreen: React.FC = () => {
	const { bottom: bottomSafe } = useSafeAreaInsets();

	const styles = useStyles();

	const {
		theme: { colors },
	} = useTheme();

	const [secureText, setSecureText] = useState<boolean>(true);
	const [remember, setRemember] = useState<boolean>(true);
	const [loading, setLoading] = useState<boolean>(false);
	const [visibleOTP, setVisibleOTP] = useState<boolean>(false);
	const [forgotEmail, setForgotEmail] = useState<string>('');
	const [forgotSecret, setForgotSecret] = useState<string>('');

	const { t } = useTranslation();

	const {
		handleSubmit,
		control,
		formState: { errors },
	} = useForm<FormType>({
		resolver: zodResolver(schema),
		defaultValues: {
			email: getSavedUser()?.[0],
			password: getSavedUser()?.[1],
		},
	});

	const {
		signIn,
		forgotPassword,
		verifyOtp,
		resetPassword,
		emailVerifiedNotify,
		loggedIn,
		resetVerifyEmail,
	} = useAuth();

	const isShowVerifyEmail = useMemo(() => {
		return loggedIn && emailVerifiedNotify;
	}, [loggedIn, emailVerifiedNotify]);

	const handleSignIn = useCallback(
		async (request: LoginDto) => {
			try {
				setLoading(true);
				const result = await signIn(request, remember);
				if (!result) {
					Toast.show({
						type: 'error',
						text1: t('notificationTitle'),
						text2: t('networkError'),
					});
				}
			} catch (error) {
				if (error) {
					Toast.show({
						type: 'error',
						text1: t('notificationTitle'),
						text2: error as string,
					});
				}
			} finally {
				setLoading(false);
			}
		},
		[remember, signIn, t],
	);

	const onSubmit: SubmitHandler<FormType> = data => {
		handleSignIn({
			email: data.email,
			password: data.password,
			provider: AuthProvider.email,
		});
	};

	// Forgot password
	const closeVerifyOtpModal = useCallback(() => {
		setVisibleOTP(false);
	}, []);

	const openVerifyOtpModal = useCallback(() => {
		setVisibleOTP(true);
	}, []);

	const forgotEmailModal = useModal();

	const resetPasswordModal = useModal();

	const onForgotPasswordPress = useCallback(() => {
		forgotEmailModal.present();
	}, [forgotEmailModal]);

	const onForgotEmailConfirm = useCallback(
		async (email: string) => {
			forgotEmailModal.dismiss();

			try {
				setLoading(true);
				const result = await forgotPassword(email);
				if (result) {
					setForgotEmail(email);
					openVerifyOtpModal();
				} else {
					Toast.show({
						type: 'error',
						text1: t('auth.userNotFound'),
					});
				}
			} finally {
				setLoading(false);
			}
		},

		[forgotEmailModal, forgotPassword, openVerifyOtpModal, t],
	);

	const onResetPassword = useCallback(
		async (password: string) => {
			try {
				resetPasswordModal.dismiss();
				setLoading(true);
				const result = await resetPassword(forgotEmail, forgotSecret, password);
				if (result) {
					Toast.show({
						type: 'success',
						text1: t('auth.resetPasswordSuccess'),
					});
				} else {
					Toast.show({
						type: 'error',
						text1: t('auth.userNotFound'),
					});
				}
			} finally {
				setForgotEmail('');
				setForgotSecret('');
				setLoading(false);
			}
		},

		[forgotEmail, forgotSecret, resetPassword, resetPasswordModal, t],
	);

	const onVerifyOtp = useCallback(
		async (otp: string, email: string) => {
			//! call api to check
			closeVerifyOtpModal();
			try {
				setLoading(true);
				const result = await verifyOtp(email, otp);
				if (result) {
					resetPasswordModal.present();
					setForgotSecret(result);
				} else {
					Toast.show({
						type: 'error',
						text1: t('auth.userNotFound'),
					});
				}
			} catch (error) {
				console.log(error);
				Toast.show({
					type: 'error',
					text1: t('auth.userNotFound'),
				});
			} finally {
				setLoading(false);
			}
		},
		[closeVerifyOtpModal, resetPasswordModal, t, verifyOtp],
	);
	// End

	const loginDecs = useMemo(() => {
		if (Platform.OS === 'android') {
			return t('auth.signInGoogleDesc');
		}

		return t('auth.signInSocialDesc');
	}, [t]);

	return (
		<TouchableWithoutFeedback onPress={Keyboard.dismiss}>
			<SafeAreaView style={styles.container}>
				<KeyboardAwareScrollView
					bottomOffset={50}
					showsVerticalScrollIndicator={false}
					style={[styles.content, { paddingBottom: bottomSafe + 16 }]}
				>
					<Box alignItems="center" mt={40}>
						<Image source={AppLogo} />
						<Box height={28} />
						<Text h3>{t('auth.signIn')}</Text>
						<Box height={12} />
						<Text style={styles.loginDesc}>{loginDecs}</Text>
						<Box height={12} />
						<SocialButton onSignIn={handleSignIn} />
					</Box>
					<Box height={32} />
					<Box alignItems="center">
						<Text style={styles.loginDesc}>{t('auth.signInEmail')}</Text>
						<Box height={20} />
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
								/>
							)}
							defaultValue=""
						/>
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
								/>
							)}
							defaultValue=""
						/>
						<Box flexDirection="row" justifyContent="space-between" alignItems="center" mb={20}>
							<CheckBox
								checked={remember}
								onPress={() => {
									setRemember(!remember);
								}}
								iconType="material-community"
								checkedIcon="checkbox-marked"
								uncheckedIcon="checkbox-blank-outline"
								title={t('auth.rememberPassword')}
								textStyle={styles.rememberPassword}
								containerStyle={styles.rememberContainer}
							/>
							<TouchableOpacity onPress={onForgotPasswordPress}>
								<Text style={styles.forgotPassword}>{t('auth.forgotPassword')}</Text>
							</TouchableOpacity>
						</Box>
						<Box width="100%">
							<Button
								title={t('auth.signIn')}
								buttonStyle={styles.button}
								onPress={handleSubmit(onSubmit)}
								loading={loading}
							/>
						</Box>
						<Box width="100%" mt={24}>
							<InformationView />
						</Box>
					</Box>
				</KeyboardAwareScrollView>
				<Modal
					ref={forgotEmailModal.ref}
					title={t('auth.forgotTitle')}
					keyboardBehavior="interactive"
					keyboardBlurBehavior="restore"
					snapPoints={['33%']}
				>
					<VerifyEmailContentView onConfirm={onForgotEmailConfirm} />
				</Modal>
				<Modal
					ref={resetPasswordModal.ref}
					title={t('auth.resetPasswordTitle')}
					keyboardBehavior="interactive"
					keyboardBlurBehavior="restore"
					snapPoints={['42%']}
				>
					<ResetPasswordView onConfirm={onResetPassword} />
				</Modal>

				<VerifyOtpModal
					email={forgotEmail}
					isVisible={visibleOTP}
					onClose={closeVerifyOtpModal}
					onVerify={onVerifyOtp}
				/>
				<Dialog
					isVisible={isShowVerifyEmail}
					title={t('auth.verifyEmailNotifyTitle')}
					description={t('auth.verifyEmailNotifyDecs')}
					onClosed={resetVerifyEmail}
					onConfirm={resetVerifyEmail}
					confirmLabel={t('know')}
					isRequired
				/>

				{loading && <Loading />}
			</SafeAreaView>
		</TouchableWithoutFeedback>
	);
};

const useStyles = makeStyles(({ colors }) => ({
	container: {
		flex: 1,
		backgroundColor: colors.background,
	},
	content: {
		flex: 1,
		paddingHorizontal: 16,
	},
	keyboardContainer: {
		flex: 1,
	},
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
	rememberPassword: {
		fontSize: 12,
		fontWeight: '400',
		color: colors.neutral800,
	},
	rememberContainer: {
		padding: 0,
		flex: 1,
	},
	forgotPassword: {
		fontSize: 12,
		color: colors.error,
	},
	button: {
		borderRadius: 40,
	},
}));

export default SignInScreen;
