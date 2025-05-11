import BottomSheet, {
	BottomSheetBackdrop,
	BottomSheetBackdropProps,
	BottomSheetFlashList,
} from '@gorhom/bottom-sheet';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import { makeStyles } from '@rneui/themed';
import { isNotNil } from 'ramda';
import React, { useCallback, useRef, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { showLocation } from 'react-native-map-link';
import { useDerivedValue, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { StationDto } from '@/models/stations/station.dto';
import { MainNavNavigationProp } from '@/types/navigation';

import useHomeDimensions from '../hooks/useHomeDimensions';
import BlurredBackground from './commons/blurred-background';
import MyLocationView from './commons/my-location-focus';
import NotificationButtonFloating from './commons/question-button-floating';
import { SearchHandle } from './commons/search-handle';
import LocationDetailsHandle from './commons/station-detail-handle';
import CallCenterButtonFloating from './commons/support-button-floating';
import NewPackageNoticeView from './new-package-notice-view';
import StationDetailView from './station-detail-view';
import StationItemView from './station-item-view';

export type StationSheet = {
	presentLocationDetails: (item: StationDto) => void;
};

type Props = {
	hasPackages: boolean;
	stations: StationDto[];
	onFocusLocation?: () => void;
	onLoadMore?: () => void;
};

const StationSheetView = React.forwardRef<StationSheet, Props>(
	({ stations = [], onFocusLocation, onLoadMore, hasPackages = false }, ref) => {
		const navigation = useNavigation<MainNavNavigationProp<'Home'>>();

		const styles = useStyles();

		const tabBarHeight = useBottomTabBarHeight();

		const { bottom: bottomSafeArea, top: topSafeArea } = useSafeAreaInsets();

		const { poiListSnapPoints, poiDetailsSnapPoints, animatedValues } = useSheetConfiguration(
			bottomSafeArea,
			tabBarHeight,
		);

		// State
		const [selectedItem, setSelectedItem] = useState<StationDto>();

		// Refs
		const poiListModalRef = useRef<BottomSheet>(null);
		const poiDetailsModalRef = useRef<BottomSheet>(null);

		const myLocationAnimatedIndex = useDerivedValue(() =>
			animatedValues.poiList.index.value > animatedValues.poiDetails.index.value
				? animatedValues.poiList.index.value
				: animatedValues.poiDetails.index.value,
		);

		const myLocationAnimatedPosition = useDerivedValue(() =>
			animatedValues.poiList.position.value < animatedValues.poiDetails.position.value
				? animatedValues.poiList.position.value
				: animatedValues.poiDetails.position.value,
		);
		// #end region

		// #region callbacks
		const handleCloseLocationDetails = useCallback(() => {
			setSelectedItem(undefined);
			poiDetailsModalRef.current?.forceClose();
			poiListModalRef.current?.collapse();
		}, []);

		const handlePresentLocationDetails = useCallback((item: StationDto) => {
			setSelectedItem(item);

			poiListModalRef.current?.forceClose();
			poiDetailsModalRef.current?.collapse();
		}, []);
		// #end region

		// renders
		const renderBackdrop = useCallback(
			(props: BottomSheetBackdropProps) => (
				<BottomSheetBackdrop
					{...props}
					enableTouchThrough
					pressBehavior="none"
					appearsOnIndex={2}
					disappearsOnIndex={1}
				/>
			),
			[],
		);

		const handleOpenMap = useCallback((item: StationDto) => {
			showLocation({
				latitude: item.location.latitude,
				longitude: item.location.longitude,
				alwaysIncludeGoogle: true,
				appsWhiteList: ['google-maps'],
			});
		}, []);

		const goToSupportScreen = useCallback(() => {
			navigation.navigate('Support');
		}, [navigation]);

		const goToNotificationScreen = useCallback(() => {
			navigation.navigate('Notification');
		}, [navigation]);

		React.useImperativeHandle(ref, () => ({
			presentLocationDetails(item: StationDto) {
				setSelectedItem(item);
				poiListModalRef.current?.forceClose();
				poiDetailsModalRef.current?.collapse();
			},
		}));

		return (
			<View style={styles.content}>
				<CallCenterButtonFloating
					animatedIndex={myLocationAnimatedIndex}
					onPress={goToSupportScreen}
				/>
				<NotificationButtonFloating
					animatedIndex={myLocationAnimatedIndex}
					onPress={goToNotificationScreen}
				/>
				<MyLocationView
					animatedIndex={myLocationAnimatedIndex}
					animatedPosition={myLocationAnimatedPosition}
					onPress={onFocusLocation}
				/>
				<BottomSheet
					ref={poiListModalRef}
					key="PoiListSheet"
					index={0}
					snapPoints={poiListSnapPoints}
					topInset={topSafeArea}
					enablePanDownToClose={false}
					keyboardBehavior="extend"
					animatedPosition={animatedValues.poiList.position}
					animatedIndex={animatedValues.poiList.index}
					handleComponent={SearchHandle}
					backdropComponent={renderBackdrop}
					backgroundComponent={BlurredBackground}
					enableDynamicSizing={false}
				>
					<StationList
						stations={stations}
						onItemPress={handlePresentLocationDetails}
						onOpenMap={handleOpenMap}
						onLoadMore={onLoadMore}
						bottomSafeArea={bottomSafeArea}
						hasPackages={hasPackages}
					/>
				</BottomSheet>
				<BottomSheet
					ref={poiDetailsModalRef}
					key="PoiDetailsSheet"
					snapPoints={poiDetailsSnapPoints}
					index={-1}
					topInset={topSafeArea}
					animatedIndex={animatedValues.poiDetails.index}
					animatedPosition={animatedValues.poiDetails.position}
					handleComponent={LocationDetailsHandle}
					backgroundComponent={BlurredBackground}
					enableDynamicSizing={false}
				>
					<StationDetailView
						onClose={handleCloseLocationDetails}
						data={selectedItem}
						onOpenMap={() => {
							if (isNotNil(selectedItem)) {
								handleOpenMap(selectedItem);
							}
						}}
					/>
				</BottomSheet>
			</View>
		);
	},
);

type StationListProps = {
	stations: StationDto[];
	bottomSafeArea: number;
	hasPackages: boolean;
	onItemPress: (item: StationDto) => void;
	onOpenMap: (item: StationDto) => void;
	onLoadMore?: () => void;
};

const StationList = React.memo(
	({
		stations,
		onItemPress,
		onOpenMap,
		onLoadMore,
		bottomSafeArea,
		hasPackages = false,
	}: StationListProps) => {
		const styles = useStyles();

		const renderItem = useCallback(
			({ item, index }: { item: StationDto; index: number }) => (
				<TouchableOpacity key={`${index}`} onPress={() => onItemPress(item)}>
					<StationItemView data={item} onOpenMap={() => onOpenMap(item)} />
				</TouchableOpacity>
			),
			[onItemPress, onOpenMap],
		);

		return (
			<View style={[styles.scrollView, { paddingBottom: bottomSafeArea + 80 }]}>
				<BottomSheetFlashList
					keyboardDismissMode="on-drag"
					keyboardShouldPersistTaps="never"
					showsVerticalScrollIndicator={false}
					keyExtractor={(i, index) => `${i.id}-${index}`}
					contentContainerStyle={styles.scrollViewContentContainer}
					data={stations}
					renderItem={renderItem}
					estimatedItemSize={175}
					onEndReached={onLoadMore}
					onEndReachedThreshold={0.5}
					removeClippedSubviews
					ListHeaderComponent={hasPackages ? <NewPackageNoticeView /> : undefined}
				/>
			</View>
		);
	},
);

const useStyles = makeStyles(() => ({
	content: {
		...StyleSheet.absoluteFillObject,
		pointerEvents: 'box-none',
	},
	scrollView: {
		flex: 1,
	},
	scrollViewContentContainer: {
		paddingHorizontal: 12,
		paddingTop: 12,
	},
	textAlign: {
		textAlign: 'center',
	},
}));

const useSheetConfiguration = (bottomSafeArea: number, tabBarHeight: number) => {
	const { SCREEN_HEIGHT, SEARCH_HANDLE_HEIGHT, LOCATION_DETAILS_HEIGHT } = useHomeDimensions();

	return {
		poiListSnapPoints: [
			bottomSafeArea + tabBarHeight + SEARCH_HANDLE_HEIGHT,
			LOCATION_DETAILS_HEIGHT + bottomSafeArea,
			'100%',
		],
		poiDetailsSnapPoints: [LOCATION_DETAILS_HEIGHT + bottomSafeArea],
		animatedValues: {
			poiList: {
				index: useSharedValue<number>(0),
				position: useSharedValue<number>(SCREEN_HEIGHT),
			},
			poiDetails: {
				index: useSharedValue<number>(0),
				position: useSharedValue<number>(SCREEN_HEIGHT),
			},
		},
	};
};

export default StationSheetView;
