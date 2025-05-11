import * as en from './en';
import * as vi from './vi';

export const resources = {
	en,
	vi,
};

export type Language = keyof typeof resources;
