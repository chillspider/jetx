import { Env } from '@/env';

export const getPublicMediaUrl = (url: string): string => {
	if (url.startsWith('https://')) return url;

	return `${Env.CDN}/${url}`;
};
