import React from 'react';
import { Appearance, Modal, SafeAreaView, View } from 'react-native';

import styles from './styles';
import { ColorScheme, findColors } from './utils';
import WebView, { ChatWootUser } from './webview';

type Props = {
	baseUrl: string;
	closeModal: () => void;
	colorScheme?: ColorScheme;
	customAttributes?: any;
	cwCookie?: string | undefined;
	isModalVisible: boolean;
	locale?: string;
	user?: ChatWootUser | undefined;
	websiteToken: string;
};

const ChatWootWidget: React.FC<Props> = ({
	isModalVisible,
	baseUrl,
	websiteToken,
	user,
	locale = 'vi',
	colorScheme = 'light',
	customAttributes = {},
	closeModal,
}) => {
	const appColorScheme = Appearance.getColorScheme();

	const { headerBackgroundColor, mainBackgroundColor } = findColors({
		colorScheme,
		appColorScheme,
	});
	return (
		<View>
			<Modal transparent visible={isModalVisible} onRequestClose={closeModal} animationType="fade">
				<View style={styles.modal}>
					<SafeAreaView style={[styles.headerView, { backgroundColor: headerBackgroundColor }]} />
					<SafeAreaView style={[styles.mainView, { backgroundColor: mainBackgroundColor }]}>
						<WebView
							websiteToken={websiteToken}
							user={user}
							baseUrl={baseUrl}
							locale={locale}
							colorScheme={colorScheme}
							customAttributes={customAttributes}
							closeModal={closeModal}
						/>
					</SafeAreaView>
				</View>
			</Modal>
		</View>
	);
};

export default ChatWootWidget;
