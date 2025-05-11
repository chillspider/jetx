/* eslint-disable react-hooks/exhaustive-deps */

import messaging from '@react-native-firebase/messaging';
import { makeStyles } from '@rneui/themed';
import Mapbox from '@rnmapbox/maps';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { Linking } from 'react-native';

import { ScreenWrapper } from '@/components';
import { useLocation } from '@/core/contexts/location-context';
import { useRefreshOnFocus } from '@/core/hooks/useRefreshOnFocus';
import { useAuth } from '@/core/store/auth';
import { buildDeepLinkFromNotificationData } from '@/core/utils';
import { StationDto } from '@/models/stations/station.dto';

import { usePackages } from '../../core/hooks/usePackages';
import { useStations } from '../../core/hooks/useStations';
import HomeDialogs from './components/home-dialogs';
import MapView from './components/map-view';
import StationSheetView, { StationSheet } from './components/station-sheet-view';
import { useDeviceRegistration } from './hooks/useDeviceRegistration';

const HomeScreen: React.FC = () => {
	const styles = useStyles();

	const { location } = useLocation();
	const { loggedIn } = useAuth();

	const { data, fetchNextPage, hasNextPage } = useStations({
		variables: {
			latitude: location?.latitude,
			longitude: location?.longitude,
		},
	});

	const { data: packages, refetch: refetchPackages } = usePackages();

	const stations = useMemo(() => {
		return data?.pages.flatMap(page => page.data || []) || [];
	}, [data]);

	useDeviceRegistration();

	// refs
	const cameraRef = useRef<Mapbox.Camera>(null);
	const stationSheetViewRef = useRef<StationSheet>(null);

	// #end region
	const handlePresentLocationDetails = useCallback((item: StationDto) => {
		stationSheetViewRef.current?.presentLocationDetails(item);
	}, []);
	// #end region

	const onLoadMore = useCallback(() => {
		if (hasNextPage) {
			fetchNextPage();
		}
	}, [hasNextPage, fetchNextPage]);

	const onFocusCurrentLocation = useCallback(() => {
		if (location) {
			cameraRef.current?.moveTo([location.longitude, location.latitude]);
		}
	}, [location]);

	useRefreshOnFocus(refetchPackages);

	const handleDeepLink = useCallback(async () => {
		if (!loggedIn) return null;

		const message = await messaging().getInitialNotification();
		const deeplinkURL = buildDeepLinkFromNotificationData(message?.data);

		if (typeof deeplinkURL === 'string') {
			Linking.openURL(deeplinkURL);
		}

		return null;
	}, []);

	useEffect(() => {
		const timer = setTimeout(async () => {
			try {
				await handleDeepLink();
			} catch (error) {
				console.error('Failed to handle deep link:', error);
			}
		}, 1000);

		return () => clearTimeout(timer);
	}, [handleDeepLink]);

	return (
		<ScreenWrapper style={styles.page}>
			<MapView
				cameraRef={cameraRef}
				stations={stations}
				onMarkerPress={handlePresentLocationDetails}
			/>
			<StationSheetView
				ref={stationSheetViewRef}
				stations={stations}
				onLoadMore={onLoadMore}
				onFocusLocation={onFocusCurrentLocation}
				hasPackages={!!packages?.length}
			/>
			<HomeDialogs />
		</ScreenWrapper>
	);
};

const useStyles = makeStyles(() => ({
	page: {
		flex: 1,
	},
	scrollView: {
		flex: 1,
	},
	scrollViewContentContainer: {
		paddingHorizontal: 16,
		paddingTop: 12,
	},
	textAlign: {
		textAlign: 'center',
	},
}));

export default HomeScreen;
