import { useRoute } from '@react-navigation/native';
import { makeStyles } from '@rneui/themed';
import React, { useCallback } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import WebView from 'react-native-webview';

import { Header, ScreenWrapper } from '@/components';
import { Loading } from '@/components/loading';
import { AppRouteProp } from '@/types/navigation';

const WebViewScreen: React.FC = () => {
	const {
		params: { uri, title },
	} = useRoute<AppRouteProp<'WebView'>>();

	const styles = useStyles();

	const { bottom } = useSafeAreaInsets();

	const renderLoadingView = useCallback(() => {
		return <Loading />;
	}, []);

	return (
		<ScreenWrapper>
			<Header type="modal" title={title || ''} />
			<WebView
				incognito
				style={[styles.webview, { paddingBottom: bottom + 24 }]}
				source={{ uri }}
				renderLoading={renderLoadingView}
			/>
		</ScreenWrapper>
	);
};

const useStyles = makeStyles(() => ({
	webview: {
		flex: 1,
	},
}));

export default WebViewScreen;
