import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, useTheme } from '@rneui/themed';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import IcHomeSelected from '@/assets/svgs/tab-location-selected.svg';
import IcHomeUnSelected from '@/assets/svgs/tab-location-unselected.svg';
import IcProfileSelected from '@/assets/svgs/tab-profile-selected.svg';
import IcProfileUnSelected from '@/assets/svgs/tab-profile-unselected.svg';
import IcScanSelected from '@/assets/svgs/tab-qr-selected.svg';
import IcScanUnselected from '@/assets/svgs/tab-qr-unselected.svg';
import { Box } from '@/components';
import { MainNavParamList } from '@/types/navigation';

import HomeScreen from './home/home-screen';
import ProfileScreen from './profile/profile-screen';
import ScanQRScreen from './scan/scan-qr-screen';

const Tab = createBottomTabNavigator<MainNavParamList>();

const ITEM_PADDING = 16;

const MainTab: React.FC = () => {
	const { bottom: bottomInset } = useSafeAreaInsets();
	const {
		theme: { colors, size, spacing },
	} = useTheme();

	const { t } = useTranslation();

	const { width: SCREEN_WIDTH } = useWindowDimensions();

	const ITEM_WIDTH = useMemo(() => {
		return (SCREEN_WIDTH - ITEM_PADDING * 2) / 3;
	}, [SCREEN_WIDTH]);

	const getTabIcon = (focused: boolean, name: keyof MainNavParamList) => {
		switch (name) {
			case 'Home': {
				return (
					<Box justifyContent="center" alignItems="center" width={ITEM_WIDTH}>
						{focused ? <IcHomeSelected /> : <IcHomeUnSelected />}
						<Box height={spacing.md} />
						<Text
							style={{
								fontSize: size.md,
								color: focused ? colors.primary : colors.neutral300,
							}}
						>
							{t('tabs.station')}
						</Text>
					</Box>
				);
			}
			case 'Scan': {
				return (
					<View style={[styles.qrScan, { width: ITEM_WIDTH }]}>
						{focused ? <IcScanSelected /> : <IcScanUnselected />}
						<Box height={spacing.md} />
						<Text
							style={{
								fontSize: size.md,
								color: focused ? colors.primary : colors.neutral300,
							}}
						>
							{t('tabs.qrCode')}
						</Text>
					</View>
				);
			}
			case 'Profile': {
				return (
					<Box justifyContent="center" alignItems="center" width={ITEM_WIDTH}>
						{focused ? <IcProfileSelected /> : <IcProfileUnSelected />}
						<Box height={spacing.md} />
						<Text
							style={{
								fontSize: size.md,
								color: focused ? colors.primary : colors.neutral300,
							}}
						>
							{t('tabs.profile')}
						</Text>
					</Box>
				);
			}

			default: {
				return <Box />;
			}
		}
	};

	return (
		<Tab.Navigator
			screenOptions={({ route }) => ({
				lazy: true,
				tabBarShowLabel: false,
				headerShown: false,
				tabBarStyle: {
					...styles.tabBar,
					height: bottomInset + (Platform.OS === 'android' ? 80 : 68),
				},
				tabBarIcon: ({ focused }) => getTabIcon(focused, route.name),
			})}
		>
			<Tab.Screen name="Home" component={HomeScreen} />
			<Tab.Screen name="Scan" component={ScanQRScreen} />
			<Tab.Screen name="Profile" component={ProfileScreen} />
		</Tab.Navigator>
	);
};

const styles = StyleSheet.create({
	tabBar: {
		borderTopWidth: 0,
		borderTopLeftRadius: 20,
		borderTopRightRadius: 20,
		bottom: 0,
		left: 0,
		right: 0,
		position: 'absolute',
		zIndex: 1000,
		shadowColor: 'black',
		shadowOffset: {
			width: 0,
			height: -8,
		},
		shadowOpacity: 0.05,
		shadowRadius: 32,
		elevation: 8,
	},
	qrScan: {
		position: 'absolute',
		justifyContent: 'center',
		alignItems: 'center',
		top: -24,
	},
});

export default MainTab;
