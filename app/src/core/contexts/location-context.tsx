import Geolocation from '@react-native-community/geolocation';
import React, { PropsWithChildren, useCallback } from 'react';
import { AppState, Platform } from 'react-native';
import { check, PERMISSIONS, request, RESULTS } from 'react-native-permissions';

type Coordinate = {
	latitude: number;
	longitude: number;
	altitude: number | null;
	accuracy: number;
	altitudeAccuracy: number | null;
	heading: number | null;
	speed: number | null;
};

type LocationContextType = {
	hasPermission: boolean;
	location: Coordinate | undefined;
	setCurrentLocation: (value: Coordinate) => void;
};

const LocationContext = React.createContext<LocationContextType | string>(
	'useLocation should be used inside LocationProvider',
);

const PER =
	Platform.OS === 'ios'
		? PERMISSIONS.IOS.LOCATION_WHEN_IN_USE
		: PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION;

export const LocationProvider: React.FC<PropsWithChildren> = ({ children }) => {
	const [hasPermission, setPermission] = React.useState(false);
	const [location, setCurrentLocation] = React.useState<Coordinate | undefined>(undefined);

	const handlePermission = useCallback(async () => {
		try {
			const result = await check(PER);
			if (result === RESULTS.GRANTED) {
				setPermission(true);
			} else if (result === RESULTS.BLOCKED) {
				//! Open Setting
			} else {
				const requestRs = await request(PER);
				if (requestRs === RESULTS.GRANTED) {
					setPermission(true);
				}
			}
		} catch (err) {
			console.log(err);
		}
	}, []);

	React.useEffect(() => {
		handlePermission();
	}, [handlePermission]);

	React.useEffect(() => {
		if (hasPermission) {
			Geolocation.getCurrentPosition(info => {
				setCurrentLocation(info.coords);
			});
		}
	}, [hasPermission]);

	React.useEffect(() => {
		const listener = AppState.addEventListener('change', () => {
			handlePermission();
		});

		return () => listener.remove();
	}, [handlePermission]);

	const value: LocationContextType = {
		hasPermission,
		location,
		setCurrentLocation,
	};

	return <LocationContext.Provider {...{ value, children }} />;
};

export const useLocation = () => {
	const c = React.useContext(LocationContext);

	if (typeof c === 'string') {
		throw Error(c);
	}

	return c;
};
