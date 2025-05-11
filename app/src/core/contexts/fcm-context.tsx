import messaging from '@react-native-firebase/messaging';
import React, { PropsWithChildren } from 'react';
import { Platform } from 'react-native';
import { checkNotifications, requestNotifications, RESULTS } from 'react-native-permissions';

import { setDeviceToken } from '../store/auth/utils';

type FCMContextType = {
	hasPermission: boolean;
	deviceToken?: string;
};

const FCMContext = React.createContext<FCMContextType | string>(
	'useFCMContext should be used inside FCMProvider',
);

export const FCMProvider: React.FC<PropsWithChildren> = ({ children }) => {
	const [hasPermission, setHasPermission] = React.useState<boolean>(false);
	const [token, setToken] = React.useState<string | undefined>();

	const handlePermission = React.useCallback(async () => {
		try {
			if (Platform.OS === 'android') {
				const check = await checkNotifications();
				if (check.status !== RESULTS.GRANTED) {
					const request = await requestNotifications([]);
					if (request.status !== RESULTS.GRANTED) {
						console.warn('User did not accept Notification permission');
						return;
					}
					setHasPermission(true);
				} else {
					setHasPermission(true);
				}
			} else {
				const currentPermission = await messaging().hasPermission();
				if (currentPermission === messaging.AuthorizationStatus.DENIED) {
					console.warn('User did not accept Notification permission');
					return;
				}
				if (currentPermission === messaging.AuthorizationStatus.NOT_DETERMINED) {
					const result = await messaging().requestPermission();

					if (result === messaging.AuthorizationStatus.DENIED) {
						console.warn('User did not accept Notification permission');
					}
				}
				setHasPermission(true);
			}
		} catch (e) {
			console.warn('Something went wrong with Notification', e, hasPermission);
		}
	}, [hasPermission]);

	React.useEffect(() => {
		handlePermission();
	}, [handlePermission]);

	React.useEffect(() => {
		if (hasPermission) {
			messaging()
				.getToken()
				.then(value => {
					setToken(value);
					setDeviceToken(value);
				});
		}
	}, [hasPermission]);

	const value: FCMContextType = {
		hasPermission,
		deviceToken: token,
	};

	return <FCMContext.Provider {...{ value, children }} />;
};

export const useFCMContext = () => {
	const c = React.useContext(FCMContext);
	if (typeof c === 'string') {
		throw Error(c);
	}
	return c;
};
