/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-argument */

import { ColorSchemeName } from 'react-native';

import {
	BG_COLOR_DARK,
	BG_COLOR_WHITE,
	COLOR_WHITE,
	POST_MESSAGE_EVENTS,
	WOOT_PREFIX,
} from './constants';

export type ColorScheme = 'dark' | 'light' | 'auto';

export const isJsonString = (string: any) => {
	try {
		JSON.parse(string);
	} catch (e) {
		return false;
	}
	return true;
};

export const createWootPostMessage = (object: any) => {
	const stringifyObject = `'${WOOT_PREFIX}${JSON.stringify(object)}'`;
	const script = `window.postMessage(${stringifyObject});`;
	return script;
};

export const getMessage = (data: string) => data.replace(WOOT_PREFIX, '');

export const generateScripts = ({ colorScheme, user, locale, customAttributes }: any) => {
	let script = '';
	if (user) {
		const userObject = {
			event: POST_MESSAGE_EVENTS.SET_USER,
			identifier: user.identifier,
			user,
		};
		script += createWootPostMessage(userObject);
	}
	if (locale) {
		const localeObject = { event: POST_MESSAGE_EVENTS.SET_LOCALE, locale };
		script += createWootPostMessage(localeObject);
	}
	if (customAttributes) {
		const attributeObject = {
			event: POST_MESSAGE_EVENTS.SET_CUSTOM_ATTRIBUTES,
			customAttributes,
		};
		script += createWootPostMessage(attributeObject);
	}
	if (colorScheme) {
		const themeObject = { event: POST_MESSAGE_EVENTS.SET_COLOR_SCHEME, darkMode: colorScheme };
		script += createWootPostMessage(themeObject);
	}
	return script;
};

export const findColors = ({
	colorScheme,
	appColorScheme,
}: {
	colorScheme: ColorScheme;
	appColorScheme: ColorSchemeName;
}) => {
	let headerBackgroundColor = COLOR_WHITE;
	let mainBackgroundColor = BG_COLOR_WHITE;

	if (colorScheme === 'dark' || (colorScheme === 'auto' && appColorScheme === 'dark')) {
		headerBackgroundColor = BG_COLOR_DARK;
		mainBackgroundColor = BG_COLOR_DARK;
	} else if (colorScheme === 'auto' && appColorScheme === 'light') {
		headerBackgroundColor = COLOR_WHITE;
		mainBackgroundColor = BG_COLOR_WHITE;
	}

	return {
		headerBackgroundColor,
		mainBackgroundColor,
	};
};
