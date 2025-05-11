/* eslint-disable react-hooks/exhaustive-deps */
import messaging from '@react-native-firebase/messaging';
import { LinkingOptions, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useEffect, useRef } from 'react';
import { Linking } from 'react-native';
import BootSplash from 'react-native-bootsplash';

import { useAuth } from '@/core/store/auth';
import { analyticsService } from '@/core/tracking/analytics';
import { buildDeepLinkFromNotificationData } from '@/core/utils';
import { Env } from '@/env';
import {
	AccountSettingScreen,
	CreateVehicleScreen,
	CustomerSupportScreen,
	EditProfileScreen,
	HistoryScreen,
	MainTab,
	PaymentSettingScreen,
	PaymentWebView,
	ProcessingScreen,
	SignInScreen,
	StartProcessScreen,
	TermOfUseScreen,
	VehicleDetailScreen,
	VoucherListScreen,
	VoucherScreen,
} from '@/screens';
import AboutCompanyScreen from '@/screens/about/about-company-screen';
import SupportTicketDetailScreen from '@/screens/customer-support/support-ticket-detail-screen';
import FnbCartScreen from '@/screens/fnb/fnb-cart-screen';
import FnbOrderHistoryScreen from '@/screens/fnb/fnb-order-history-screen';
import ProductFilterScreen from '@/screens/fnb/fnb-product-filter-screen';
import NewsScreen from '@/screens/news/news-screen';
import NotificationScreen from '@/screens/notification/notification-screen';
import PackagePreviewPayment from '@/screens/package/package-preview-payment';
import PackageQRWaitingScreen from '@/screens/package/package-qr-waiting-screen';
import PackageScreen from '@/screens/package/package-screen';
import PaymentCreateCardScreen from '@/screens/payment/payment-create-card-screen';
import WaitingStaticQRScreen from '@/screens/payment/static-qr-payment-screen';
import ReferralScreen from '@/screens/referral/referral-screen';
import ScanVoucherCodeScreen from '@/screens/scan-voucher-code/scan-voucher-code-screen';
import WaitingStartMachineScreen from '@/screens/start-process/waiting-start-machine-screen';
import WebViewScreen from '@/screens/webview/webview-screen';
import { type AppStackParamList, navigatorRef } from '@/types/navigation';

const Stack = createNativeStackNavigator<AppStackParamList>();

const AppNavigator = () => {
	const routeNameRef = useRef<string | undefined>(undefined);

	const { loggedIn, emailVerifiedNotify, hydrate } = useAuth();

	useEffect(() => {
		const init = async () => {
			await hydrate();

			setTimeout(() => {
				BootSplash.hide();
			}, 1000);
		};

		init();
	}, []);

	const linking: LinkingOptions<AppStackParamList> = {
		prefixes: [`${Env.APP_ID}://`],
		config: {
			initialRouteName: 'MainTab',
			screens: {
				Payment: {
					path: 'payment/result',
					parse: {
						status: (status: string | undefined) => status || undefined,
						orderId: (orderId: string | undefined) => orderId || undefined,
						type: (type: string | undefined) => type || 'default',
					},
				},
				CreatePaymentCard: {
					path: 'tokenize/result',
					parse: {
						status: (status: string | undefined) => status || undefined,
					},
				},
				MainTab: {
					path: 'home',
				},
				Account: {
					path: 'account',
				},
				EditProfile: {
					path: 'editProfile',
				},
				Support: {
					path: 'support',
				},
				Voucher: {
					path: 'voucher',
				},
				News: {
					path: 'news',
				},
				History: {
					path: 'history',
				},
				TermOfUse: {
					path: 'termOfUse',
				},
				CreateVehicle: {
					path: 'createVehicle',
				},
				Processing: {
					path: 'order',
					parse: {
						orderId: (orderId: string | undefined) => orderId || undefined,
					},
				},
				SupportDetail: {
					path: 'supportDetail',
					parse: {
						id: (id: string | undefined) => id || undefined,
					},
				},
				Card: {
					path: 'card',
				},
				About: {
					path: 'about',
				},
				Referral: {
					path: 'referral',
				},
				Package: {
					path: 'package',
				},
			},
		},
		async getInitialURL() {
			try {
				// Check for initial notification first when app is launched from killed state
				// const message = await messaging().getInitialNotification();
				// const deeplinkURL = buildDeepLinkFromNotificationData(message?.data);
				// if (typeof deeplinkURL === 'string') {
				// 	return deeplinkURL;
				// }

				// Then check for regular deep link URL
				const url = await Linking.getInitialURL();
				if (typeof url === 'string') {
					return url;
				}

				return null;
			} catch (error) {
				console.log('error', error);
				return null;
			}
		},
		subscribe(listener: (url: string) => void) {
			const onReceiveURL = ({ url }: { url: string }) => listener(url);

			// Listen to incoming links from deep linking
			const linkingSubscription = Linking.addEventListener('url', onReceiveURL);

			// onNotificationOpenedApp: When the application is running, but in the background.
			const unsubscribe = messaging().onNotificationOpenedApp(remoteMessage => {
				const url = buildDeepLinkFromNotificationData(remoteMessage.data);
				if (typeof url === 'string') {
					listener(url);
				}
			});

			return () => {
				linkingSubscription.remove();
				unsubscribe();
			};
		},
	};

	return (
		<NavigationContainer
			ref={navigatorRef}
			linking={linking}
			onReady={() => {
				routeNameRef.current = navigatorRef.current?.getCurrentRoute()?.name;
			}}
			onStateChange={() => {
				const previousRouteName = routeNameRef.current;
				const currentRouteName = navigatorRef.current?.getCurrentRoute()?.name;

				if (previousRouteName !== currentRouteName) {
					analyticsService.logScreenView(currentRouteName, currentRouteName);
				}

				routeNameRef.current = currentRouteName;
			}}
		>
			<Stack.Navigator screenOptions={{ headerShown: false }}>
				{loggedIn && !emailVerifiedNotify ? (
					<Stack.Group>
						<Stack.Screen name="MainTab" component={MainTab} />
						<Stack.Screen name="Account" component={AccountSettingScreen} />
						<Stack.Screen
							name="Support"
							component={CustomerSupportScreen}
							options={{
								animation: 'slide_from_bottom',
							}}
						/>
						<Stack.Screen
							name="News"
							component={NewsScreen}
							options={{
								animation: 'slide_from_bottom',
							}}
						/>
						<Stack.Screen name="Voucher" component={VoucherScreen} />
						<Stack.Screen name="Card" component={PaymentSettingScreen} />
						<Stack.Screen
							name="WaitingQR"
							component={WaitingStaticQRScreen}
							options={{
								gestureEnabled: false,
							}}
						/>
						<Stack.Screen
							name="CreatePaymentCard"
							component={PaymentCreateCardScreen}
							options={{
								gestureEnabled: false,
							}}
						/>
						<Stack.Screen name="History" component={HistoryScreen} />
						<Stack.Screen name="Vehicle" component={VehicleDetailScreen} />
						<Stack.Screen name="CreateVehicle" component={CreateVehicleScreen} />
						<Stack.Screen name="StartProcess" component={StartProcessScreen} />
						<Stack.Screen name="Waiting" component={WaitingStartMachineScreen} />
						<Stack.Screen name="Processing" component={ProcessingScreen} />
						<Stack.Screen
							name="Payment"
							component={PaymentWebView}
							options={{
								gestureEnabled: false,
							}}
						/>
						<Stack.Screen name="EditProfile" component={EditProfileScreen} />
						<Stack.Screen
							name="OrderVoucher"
							component={VoucherListScreen}
							options={{
								animation: 'slide_from_bottom',
							}}
						/>
						<Stack.Screen
							name="SupportDetail"
							component={SupportTicketDetailScreen}
							options={{
								animation: 'slide_from_bottom',
							}}
						/>
						<Stack.Screen
							name="Referral"
							component={ReferralScreen}
							options={{
								animation: 'slide_from_bottom',
							}}
						/>
						<Stack.Screen
							name="Package"
							component={PackageScreen}
							options={{
								animation: 'slide_from_bottom',
							}}
						/>
						<Stack.Screen name="PackagePrePayment" component={PackagePreviewPayment} />
						<Stack.Screen name="PackageQRWaiting" component={PackageQRWaitingScreen} />
						<Stack.Screen
							name="Notification"
							component={NotificationScreen}
							options={{
								animation: 'slide_from_bottom',
							}}
						/>
						<Stack.Group>
							<Stack.Screen name="FnbCart" component={FnbCartScreen} />
							<Stack.Screen name="FnbOrderHistory" component={FnbOrderHistoryScreen} />
							<Stack.Screen
								name="FnbProductFilter"
								component={ProductFilterScreen}
								options={{
									animation: 'slide_from_bottom',
								}}
							/>
						</Stack.Group>
						<Stack.Screen name="ScanVoucherCode" component={ScanVoucherCodeScreen} />
					</Stack.Group>
				) : (
					<Stack.Group>
						<Stack.Screen name="SignIn" component={SignInScreen} />
					</Stack.Group>
				)}
				<Stack.Group>
					<Stack.Screen
						name="TermOfUse"
						component={TermOfUseScreen}
						options={{
							animation: 'slide_from_bottom',
						}}
					/>
					<Stack.Screen
						name="About"
						component={AboutCompanyScreen}
						options={{
							animation: 'slide_from_bottom',
						}}
					/>
					<Stack.Screen
						name="WebView"
						component={WebViewScreen}
						options={{
							animation: 'slide_from_bottom',
						}}
					/>
				</Stack.Group>
			</Stack.Navigator>
		</NavigationContainer>
	);
};

export default AppNavigator;
