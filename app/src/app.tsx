/* eslint-disable react/style-prop-object */
import './translations';

import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { ThemeProvider } from '@rneui/themed';
import * as Sentry from '@sentry/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { StyleSheet } from 'react-native';
import CodePush, { CodePushOptions } from 'react-native-code-push';
import { SystemBars } from 'react-native-edge-to-edge';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import ToastProvider from './components/toast/toast';
import { FCMProvider } from './core/contexts/fcm-context';
import { FnbOrderProvider } from './core/contexts/fnb-order-context';
import { LocationProvider } from './core/contexts/location-context';
import { NotificationProvider } from './core/contexts/notification-context';
import { VehicleProvider } from './core/contexts/vehicle-context';
import { MqttProvider } from './core/mqtt/context/mqtt-context';
import { Env } from './env';
import AppNavigator from './navigators/application';
import theme from './theme';

if (!__DEV__) {
	console.log = () => {};
	console.warn = () => {};
	console.error = () => {};

	Sentry.init({
		dsn: Env.SENTRY_DNS,
	});
}

export const queryClient = new QueryClient();

const App: React.FC = () => {
	return (
		<GestureHandlerRootView style={styles.container}>
			<MqttProvider>
				<KeyboardProvider>
					<SafeAreaProvider>
						<SystemBars style="dark" />
						<FCMProvider>
							<QueryClientProvider client={queryClient}>
								<ThemeProvider theme={theme}>
									<BottomSheetModalProvider>
										<LocationProvider>
											<VehicleProvider>
												<NotificationProvider>
													<FnbOrderProvider>
														<AppNavigator />
														<ToastProvider />
													</FnbOrderProvider>
												</NotificationProvider>
											</VehicleProvider>
										</LocationProvider>
									</BottomSheetModalProvider>
								</ThemeProvider>
							</QueryClientProvider>
						</FCMProvider>
					</SafeAreaProvider>
				</KeyboardProvider>
			</MqttProvider>
		</GestureHandlerRootView>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
});

const codePushOpts: CodePushOptions = {
	checkFrequency: CodePush.CheckFrequency.ON_APP_START,
};

export default CodePush(codePushOpts)(Sentry.wrap(App));
