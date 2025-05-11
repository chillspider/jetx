import { changeLanguage } from 'i18next';
import { useCallback } from 'react';
import { useMMKVString } from 'react-native-mmkv';

import { storage } from '@/core/storage';

import { Language } from './resources';

export const LOCAL = 'local';

export const getLanguage = () => storage.getString(LOCAL) || 'vi';

export const useSelectedLanguage = () => {
	const [language, setLang] = useMMKVString(LOCAL);

	const setLanguage = useCallback(
		(lang: Language) => {
			setLang(lang);
			if (lang !== undefined) changeLanguage(lang);
		},
		[setLang],
	);

	return { language: language as Language, setLanguage };
};
