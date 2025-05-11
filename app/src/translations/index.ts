import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import { resources } from './resources';
import { getLanguage } from './utils';
import * as vi from './vi';

type TupleUnion<U extends string, R extends unknown[] = []> = {
	[S in U]: Exclude<U, S> extends never ? [...R, S] : TupleUnion<Exclude<U, S>, [...R, S]>;
}[U];

const ns = Object.keys(vi) as TupleUnion<keyof typeof vi>;

export const defaultNS = ns[0];

void i18n.use(initReactI18next).init({
	ns,
	defaultNS,
	resources,
	lng: getLanguage(),
	fallbackLng: 'vi',
	interpolation: {
		escapeValue: false, // not needed for react as it escapes by default
	},
	compatibilityJSON: 'v3',
});

export default i18n;
