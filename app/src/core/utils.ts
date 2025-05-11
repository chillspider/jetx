/* eslint-disable no-restricted-syntax */
import { Env } from '@/env';
import {
	NotificationData,
	NotificationOrderData,
} from '@/models/notification/notification-order.dto';
import { Platform } from 'react-native';
import type { StoreApi, UseBoundStore } from 'zustand';

type WithSelectors<S> = S extends { getState: () => infer T }
	? S & { use: { [K in keyof T]: () => T[K] } }
	: never;

export const createSelectors = <S extends UseBoundStore<StoreApi<object>>>(_store: S) => {
	const store = _store as WithSelectors<typeof _store>;
	store.use = {};
	for (const k of Object.keys(store.getState())) {
		(store.use as any)[k] = () => store(s => s[k as keyof typeof s]);
	}

	return store;
};

export const buildDeepLinkFromNotificationData = (data: any): string | null => {
	try {
		const rawData = Platform.OS === 'android' ? data : data.data;
		const notificationData: NotificationData = JSON.parse(JSON.stringify(rawData));

		const navigationId = notificationData?.deepLink;
		let id = null;
		if (!navigationId) return null;

		if (notificationData.data) {
			const notiData: NotificationOrderData = JSON.parse(notificationData.data);
			if (notiData.id) {
				id = notiData.id;
			}
		}

		const prefix = `${Env.APP_ID}`;
		if (navigationId === 'home') {
			return `${prefix}://home`;
		}
		if (navigationId === 'account') {
			return `${prefix}://account`;
		}
		if (navigationId === 'editProfile') {
			return `${prefix}://editProfile`;
		}
		if (navigationId === 'support') {
			return `${prefix}://support`;
		}
		if (navigationId.includes('supportDetail') && id) {
			return `${prefix}://supportDetail?id=${id}`;
		}
		if (navigationId === 'voucher') {
			return `${prefix}://voucher`;
		}
		if (navigationId === 'news') {
			return `${prefix}://news`;
		}
		if (navigationId === 'history') {
			return `${prefix}://history`;
		}
		if (navigationId === 'termOfUse') {
			return `${prefix}://termOfUse`;
		}
		if (navigationId === 'createVehicle') {
			return `${prefix}://createVehicle`;
		}
		if (navigationId.includes('order') && id) {
			return `${prefix}://order?orderId=${id}`;
		}
		if (navigationId === 'card') {
			return `${prefix}://card`;
		}
		if (navigationId === 'about') {
			return `${prefix}://about`;
		}
		if (navigationId === 'referral') {
			return `${prefix}://referral`;
		}
		if (navigationId === 'package') {
			return `${prefix}://package`;
		}

		return null;
	} catch (error) {
		console.log('error', error);
		return null;
	}
};
