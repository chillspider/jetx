import { makeStyles } from '@rneui/themed';
import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import WebView from 'react-native-webview';

import { Header, ScreenWrapper } from '@/components';
import { Loading } from '@/components/loading';
import { useAppSetting } from '@/core/store/setting';

const TermOfUseScreen: React.FC = () => {
	const { t } = useTranslation();

	const styles = useStyles();

	const { policyUrl } = useAppSetting();

	const renderLoadingView = useCallback(() => {
		return <Loading />;
	}, []);

	const { bottom } = useSafeAreaInsets();

	return (
		<ScreenWrapper>
			<Header type="modal" title={t('profile.termOfUse')} />
			<WebView
				incognito
				style={[styles.webview, { paddingBottom: bottom + 24 }]}
				source={{ uri: policyUrl }}
				renderLoading={renderLoadingView}
			/>
		</ScreenWrapper>
	);
};

const useStyles = makeStyles(() => ({
	container: {},
	webview: {
		flex: 1,
	},
}));

export default TermOfUseScreen;
