/* eslint-disable @typescript-eslint/require-await */

/* eslint-disable no-underscore-dangle */
/* eslint-disable @typescript-eslint/naming-convention */
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import * as Sentry from '@sentry/react-native';
import { AxiosError } from 'axios';
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

import { analyticsService } from '@/core/tracking/analytics';
import { createSelectors } from '@/core/utils';
import { AuthProvider, UserStatus } from '@/models/auth/enums/auth-provider.enum';
import { LoginDto } from '@/models/auth/request/login.dto';
import { UserPayloadDto } from '@/models/auth/response/user-payload.dto';
import userApi from '@/services/auth/auth-services';

import {
	getAccessToken,
	getDeviceToken,
	removeCWCookie,
	removeFirstLogin,
	removeReferralShowed,
	removeSavedUser,
	removeToken,
	setAccessToken,
	setFirstLogin,
	setSavedUser,
} from './utils';

interface AuthState {
	loggedIn: boolean;
	emailVerifiedNotify: boolean;
	user?: UserPayloadDto;
	loginProvider: AuthProvider;
	signIn: (request: LoginDto, remember: boolean) => Promise<UserPayloadDto | undefined | null>;
	signOut: () => Promise<void>;
	hydrate: () => Promise<boolean>;
	forgotPassword: (email: string) => Promise<boolean>;
	verifyOtp: (email: string, otp: string) => Promise<string | undefined | null>;
	resetPassword: (email: string, secret: string, password: string) => Promise<boolean>;
	updatePassword: (password: string, oldPassword: string) => Promise<boolean>;
	deleteProfile: () => Promise<boolean>;
	getProfile: () => Promise<void>;
	registerDevice: () => Promise<void>;
	removeDevice: () => Promise<void>;
	resetVerifyEmail: () => void;
}

const _useAuth = create<AuthState>()(
	immer<AuthState>((set, get) => ({
		loggedIn: false,
		emailVerifiedNotify: false,
		loginProvider: AuthProvider.email,

		signOut: async () => {
			await get().removeDevice();

			try {
				const provider = get().loginProvider;
				if (provider === AuthProvider.google) {
					GoogleSignin.signOut();
				}
			} catch (err) {
				console.log(err);
			}

			removeToken();
			removeFirstLogin();
			removeReferralShowed();
			removeCWCookie();

			set({
				loggedIn: false,
				user: undefined,
				emailVerifiedNotify: false,
				loginProvider: AuthProvider.email,
			});
		},
		hydrate: async () => {
			const token = getAccessToken();

			if (token) {
				try {
					const res = await userApi.getProfile();
					if (res.data) {
						set({
							loggedIn: true,
							user: res.data,
						});
					} else {
						get().signOut();
					}
				} catch (error) {
					Sentry.captureException(error);
					get().signOut();
				}
			}

			return true;
		},
		signIn: async (request: LoginDto, remember: boolean) => {
			try {
				analyticsService.logUserLogin(request.provider);
				const res = await userApi.login(request);
				if (res.data) {
					setAccessToken(res.data.accessToken);
					const { user } = res.data;
					set({
						loggedIn: true,
						user,
						loginProvider: request.provider,
						emailVerifiedNotify: user?.status === UserStatus.INACTIVE,
					});
				}
				setFirstLogin();
				get().registerDevice();

				if (remember && request.email && request.password) {
					setSavedUser([request.email, request.password]);
				} else {
					removeSavedUser();
				}
				return res.data.user;
			} catch (err) {
				Sentry.captureException(err);
				if (err instanceof AxiosError && err.response?.data?.message) {
					throw err.response.data.message;
				}
				throw err;
			}
		},
		forgotPassword: async (email: string) => {
			try {
				const result = await userApi.forgotPassword(email);
				return result.data;
			} catch (error) {
				console.log(error);
				return false;
			}
		},
		verifyOtp: async (email: string, otp: string) => {
			const secret = await userApi.verifyOtp(email, otp);
			return secret.data;
		},
		resetPassword: async (email: string, secret: string, password: string) => {
			try {
				const result = await userApi.resetPassword(email, password, secret);
				return result.data;
			} catch (error) {
				console.log(error);
				return false;
			}
		},
		updatePassword: async (password: string, oldPassword: string) => {
			try {
				const result = await userApi.updatePassword(oldPassword, password);
				return result.data;
			} catch (error) {
				Sentry.captureException(error);
				return false;
			}
		},
		deleteProfile: async () => {
			try {
				const result = await userApi.deleteProfile();
				return result.data;
			} catch (error) {
				Sentry.captureException(error);
				return false;
			}
		},
		getProfile: async () => {
			try {
				const res = await userApi.getProfile();
				set({
					user: res.data,
				});
			} catch (error) {
				Sentry.captureException(error);
			}
		},
		registerDevice: async () => {
			try {
				const deviceToken = getDeviceToken();

				if (deviceToken) {
					userApi.registerDeviceToken(deviceToken);
				}
			} catch (err) {
				console.log(err);
			}
		},
		removeDevice: async () => {
			try {
				const deviceToken = getDeviceToken();

				if (deviceToken) {
					await userApi.removeDeviceToken(deviceToken);
				}
			} catch (err) {
				console.log(err);
			}
		},
		resetVerifyEmail: () => {
			set({
				emailVerifiedNotify: false,
			});
		},
	})),
);

export const useAuth = createSelectors(_useAuth);

export const signOut = () => _useAuth.getState().signOut();
export const signIn = (request: LoginDto, remember: boolean) =>
	_useAuth.getState().signIn(request, remember);
export const useHydrateAuth = () => _useAuth.getState().hydrate();
export const forgotPassword = (email: string) => _useAuth.getState().forgotPassword(email);
