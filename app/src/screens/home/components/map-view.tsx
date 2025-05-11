import Mapbox from '@rnmapbox/maps';
import { isNotNil } from 'ramda';
import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import MarkerIcon from '@/assets/svgs/ic-marker-station.svg';
import { useLocation } from '@/core/contexts/location-context';
import { Env } from '@/env';
import { StationDto } from '@/models/stations/station.dto';

import useHomeDimensions from '../hooks/useHomeDimensions';

Mapbox.setAccessToken(Env.MAP_BOX_TOKEN);

type Props = {
	stations: StationDto[];
	onMarkerPress: (station: StationDto) => void;
	cameraRef: React.RefObject<Mapbox.Camera>;
};

const MapView: React.FC<Props> = ({ stations = [], onMarkerPress, cameraRef }) => {
	const { location } = useLocation();

	const centerCoordinate = useMemo(() => {
		if (isNotNil(location)) {
			return [location.longitude, location.latitude];
		}
		return undefined;
	}, [location]);

	const { SCREEN_WIDTH, SCREEN_HEIGHT } = useHomeDimensions();

	return (
		<View style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT }}>
			<Mapbox.MapView style={styles.map}>
				<Mapbox.Camera
					ref={cameraRef}
					centerCoordinate={centerCoordinate}
					zoomLevel={14}
					maxZoomLevel={16}
					minZoomLevel={10}
					animationDuration={1000}
				/>
				<Mapbox.UserLocation showsUserHeadingIndicator />
				{stations
					.filter(
						station =>
							isNotNil(station.location.longitude) &&
							isNotNil(station.location.latitude) &&
							typeof station.location.longitude === 'number' &&
							typeof station.location.latitude === 'number',
					)
					.map(station => (
						<Mapbox.PointAnnotation
							key={`${station.id}`}
							id={`station-${station.id}`}
							coordinate={[station.location.longitude, station.location.latitude]}
							onSelected={() => onMarkerPress(station)}
						>
							<MarkerIcon />
							<Mapbox.Callout title={station.name} />
						</Mapbox.PointAnnotation>
					))}
			</Mapbox.MapView>
		</View>
	);
};

const styles = StyleSheet.create({
	page: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
	map: {
		flex: 1,
	},
});

export default MapView;
