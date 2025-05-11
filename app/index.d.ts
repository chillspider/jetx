declare module '*.png' {
	const value: any;
	export = value;
}

declare module '*.svg' {
	import React from 'react';
	import { SvgProps } from 'react-native-svg';

	const content: React.FC<SvgProps>;
	export default content;
}

declare module 'react-native-config' {
	export interface NativeConfig {
		API_URL?: string;
		VOUCHER_API_URL?: string;
		APP_ENV?: string;
		APP_NAME?: string;
		IOS_CLIENT_ID?: string;
		WEB_CLIENT_ID?: string;
		MAP_BOX_TOKEN?: string;
		CDN?: string;
	}

	export const Config: NativeConfig;
	export default Config;
}
