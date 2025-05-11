import Config from 'react-native-config';
import z from 'zod';

const client = z.object({
	APP_ENV: z.enum(['development', 'production']),
	APP_NAME: z.string(),
	API_URL: z.string(),
	VOUCHER_API_URL: z.string(),
	IOS_CLIENT_ID: z.string(),
	WEB_CLIENT_ID: z.string(),
	MAP_BOX_TOKEN: z.string(),
	CDN: z.string(),
	APP_ID: z.string(),
	SENTRY_DNS: z.string(),
	MQTT_HOST: z.string(),
	CHATWOOT_WEBSITE_TOKEN: z.string(),
	CHATWOOT_BASE_URL: z.string(),
	CHATWOOT_HMAC_KEY: z.string(),
});

const clientEnv = {
	APP_ENV: Config.APP_ENV || 'production',
	APP_NAME: Config.APP_NAME || '',
	APP_ID: Config.APP_ID || '',
	API_URL: Config.API_URL || '',
	VOUCHER_API_URL: Config.VOUCHER_API_URL || '',
	IOS_CLIENT_ID: Config.IOS_CLIENT_ID || '',
	WEB_CLIENT_ID: Config.WEB_CLIENT_ID || '',
	MAP_BOX_TOKEN: Config.MAP_BOX_TOKEN || '',
	CDN: Config.CDN || '',
	SENTRY_DNS: Config.SENTRY_DNS || '',
	MQTT_HOST: Config.MQTT_HOST || '',
	CHATWOOT_WEBSITE_TOKEN: Config.CHATWOOT_WEBSITE_TOKEN || '',
	CHATWOOT_BASE_URL: Config.CHATWOOT_BASE_URL || '',
	CHATWOOT_HMAC_KEY: Config.CHATWOOT_HMAC_KEY || '',
};

const Env = client.parse(clientEnv);

export { Env };
