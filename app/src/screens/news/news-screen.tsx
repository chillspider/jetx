import { makeStyles } from '@rneui/themed';
import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import WebView from 'react-native-webview';

import { Header, ScreenWrapper } from '@/components';
import { Loading } from '@/components/loading';
import { useAppSetting } from '@/core/store/setting';

const NewsScreen: React.FC = () => {
	const styles = useStyles();

	const { t } = useTranslation();
	const { bottom } = useSafeAreaInsets();

	const renderLoadingView = useCallback(() => {
		return <Loading />;
	}, []);

	const { newsUrl } = useAppSetting();

	return (
		<ScreenWrapper>
			<Header type="modal" title={t('news.title')} />
			<WebView
				incognito
				style={[styles.webview, { paddingBottom: bottom + 24 }]}
				source={{ uri: newsUrl }}
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

export default NewsScreen;
