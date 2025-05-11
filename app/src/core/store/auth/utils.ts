import { useMMKVBoolean } from 'react-native-mmkv';

import { getItem, removeItem, setItem, storage } from '@/core/storage';

const ACCESS_TOKEN = 'access_token';

export const getAccessToken = () => getItem<string | null>(ACCESS_TOKEN);

export const removeToken = () => removeItem(ACCESS_TOKEN);

export const setAccessToken = (token: string) => setItem<string>(ACCESS_TOKEN, token);

const DEVICE_TOKEN = 'device_token';

export const getDeviceToken = () => getItem<string | null>(DEVICE_TOKEN);

export const removeDeviceToken = () => removeItem(DEVICE_TOKEN);

export const setDeviceToken = (token: string) => setItem<string>(DEVICE_TOKEN, token);

const SAVED_USER = 'saved_user';

export type SavedUser = [string, string];

export const getSavedUser = () => getItem<SavedUser | null>(SAVED_USER);

export const removeSavedUser = () => removeItem(SAVED_USER);

export const setSavedUser = (user: SavedUser) => setItem<SavedUser>(SAVED_USER, user);

const FIRST_LOGIN_TIME = 'login_first_time';

export const getFirstLogin = () => getItem<boolean | null>(FIRST_LOGIN_TIME);

export const removeFirstLogin = () => removeItem(FIRST_LOGIN_TIME);

export const setFirstLogin = () => setItem<boolean>(FIRST_LOGIN_TIME, true);

export const useLoginIsFirstTime = () => {
	const [isLoginFirstTime, setLoginIsFirstTime] = useMMKVBoolean(FIRST_LOGIN_TIME, storage);

	if (isLoginFirstTime === undefined) {
		return [false, setLoginIsFirstTime] as const;
	}

	return [isLoginFirstTime, setLoginIsFirstTime] as const;
};

export const IS_REFERRAL_FIRST_TIME_SHOW = 'IS_REFERRAL_FIRST_TIME_SHOW';

export const useReferralShowed = () => {
	const [isReferralShowed, setIsReferralShowed] = useMMKVBoolean(
		IS_REFERRAL_FIRST_TIME_SHOW,
		storage,
	);

	if (isReferralShowed === undefined) {
		return [false, setIsReferralShowed] as const;
	}

	return [isReferralShowed, setIsReferralShowed] as const;
};

export const removeReferralShowed = () => removeItem(IS_REFERRAL_FIRST_TIME_SHOW);

const CHATWOOT_AUTH_TOKEN = 'chatwoot_access_token';

export const getCWCookie = () => getItem<string | null>(CHATWOOT_AUTH_TOKEN);

export const removeCWCookie = () => removeItem(CHATWOOT_AUTH_TOKEN);

export const setCWCookie = (token: string) => setItem<string>(CHATWOOT_AUTH_TOKEN, token);
