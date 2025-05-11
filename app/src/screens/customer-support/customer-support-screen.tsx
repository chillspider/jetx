import { makeStyles, Text } from '@rneui/themed';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useWindowDimensions, View } from 'react-native';
import { Route, SceneRendererProps, TabBar, TabView } from 'react-native-tab-view';

import { Header, ScreenWrapper } from '@/components';

import CreateSupportTicketScreen from './create-support-ticket/create-support-ticket-screen';
import SupportHistoryScreen from './support-history/support-history-screen';

const TAB_INDICATOR_SIZE = 120;

const CustomerSupportScreen: React.FC = () => {
	const { t } = useTranslation();
	const styles = useStyles();

	const [index, setIndex] = useState<number>(0);
	const [routes] = useState([
		{ key: 'createTicket', title: t('support.create_ticket') },
		{ key: 'supportHistory', title: t('support.history') },
	]);

	const renderScene = ({ route }: SceneRendererProps & { route: Route }) => {
		switch (route.key) {
			case 'createTicket':
				return <CreateSupportTicketScreen jumpToHistoryTab={() => setIndex(1)} />;
			case 'supportHistory':
				return <SupportHistoryScreen />;
			default:
				return null;
		}
	};

	const { width } = useWindowDimensions();

	return (
		<ScreenWrapper>
			<Header type="modal" title={t('profile.customerSupport')} />
			<TabView
				lazy
				navigationState={{ index, routes }}
				renderScene={renderScene}
				onIndexChange={setIndex}
				initialLayout={{ width }}
				renderTabBar={props => (
					<TabBar
						{...props}
						indicatorStyle={[
							styles.indicator,
							{
								width: TAB_INDICATOR_SIZE,
								left: (width / 2 - TAB_INDICATOR_SIZE) / 2,
							},
						]}
						style={styles.tabBar}
						getLabelText={({ route }) => route.title}
						renderLabel={({ route, focused }) => (
							<View style={focused ? styles.activeLabelContainer : styles.inactiveLabelContainer}>
								<Text style={focused ? styles.activeLabel : styles.inactiveLabel}>
									{route.title}
								</Text>
							</View>
						)}
					/>
				)}
			/>
		</ScreenWrapper>
	);
};

const useStyles = makeStyles(({ colors }) => ({
	container: {},
	tabBar: {
		backgroundColor: colors.background,
		elevation: 0,
		shadowOpacity: 0,
		borderBottomWidth: 0,
	},
	activeLabelContainer: {
		paddingVertical: 10,
	},
	inactiveLabelContainer: {
		paddingVertical: 10,
	},
	activeLabel: {
		color: colors.primary,
		fontSize: 16,
		textTransform: 'none',
	},
	inactiveLabel: {
		color: colors.neutral500,
		fontSize: 16,
		fontWeight: '300',
		textTransform: 'none',
	},
	indicator: {
		backgroundColor: colors.primary500,
		alignSelf: 'center',
	},
}));

export default CustomerSupportScreen;
