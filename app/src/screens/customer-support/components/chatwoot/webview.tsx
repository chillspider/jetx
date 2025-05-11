/* eslint-disable @typescript-eslint/no-unsafe-argument */

import React from 'react';
import { Linking, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

import { setCWCookie } from '@/core/store/auth/utils';

import { ColorScheme, generateScripts, getMessage, isJsonString } from './utils';

export type ChatWootUser = {
	identifier: string;
	avatar_url?: string | undefined;
	email?: string | undefined;
	identifier_hash?: string | undefined;
	name?: string | undefined;
};

type Props = {
	baseUrl: string;
	closeModal: () => void;
	colorScheme: ColorScheme;
	customAttributes: any;
	cwCookie?: string | null | undefined;
	locale: string;
	user?: ChatWootUser | undefined;
	websiteToken: string;
};

const WebViewComponent: React.FC<Props> = ({
	baseUrl,
	websiteToken,
	cwCookie = '',
	locale = 'en',
	colorScheme = 'light',
	user = {},
	customAttributes = {},
	closeModal,
}) => {
	const [currentUrl, setCurrentUrl] = React.useState<string | undefined>(undefined);

	let widgetUrl = `${baseUrl}/widget?website_token=${websiteToken}&locale=${locale}`;

	if (cwCookie) {
		widgetUrl = `${widgetUrl}&cw_conversation=${cwCookie}`;
	}

	const injectedJavaScript = generateScripts({
		user,
		locale,
		customAttributes,
		colorScheme,
	});

	const onShouldStartLoadWithRequest = (request: any) => {
		const isMessageView = currentUrl && currentUrl.includes('#/messages');
		const isAttachmentUrl = !widgetUrl.includes(request.url);
		// Open the attachments only in the external browser
		const shouldRedirectToBrowser = isMessageView && isAttachmentUrl;
		if (shouldRedirectToBrowser) {
			Linking.openURL(request.url);
			return false;
		}

		return true;
	};

	const handleWebViewNavigationStateChange = (newNavState: any) => {
		setCurrentUrl(newNavState.url);
	};

	return (
		<WebView
			source={{
				uri: widgetUrl,
			}}
			onMessage={event => {
				const { data } = event.nativeEvent;
				const message = getMessage(data);
				if (isJsonString(message)) {
					const parsedMessage = JSON.parse(message);
					const { event: eventType, type } = parsedMessage;
					if (eventType === 'loaded') {
						const {
							config: { authToken },
						} = parsedMessage;

						setCWCookie(authToken);
					}
					if (type === 'close-widget') {
						closeModal();
					}
				}
			}}
			scalesPageToFit
			useWebKit
			sharedCookiesEnabled
			javaScriptEnabled
			domStorageEnabled
			style={styles.WebViewStyle}
			injectedJavaScript={injectedJavaScript}
			onShouldStartLoadWithRequest={onShouldStartLoadWithRequest}
			onNavigationStateChange={handleWebViewNavigationStateChange}
			scrollEnabled
		/>
	);
};

const styles = StyleSheet.create({
	modal: {
		flex: 1,
		borderRadius: 4,
		overflow: 'hidden',
	},
	webViewContainer: {
		flex: 1,
	},
	WebViewStyle: {},
});

export default WebViewComponent;
