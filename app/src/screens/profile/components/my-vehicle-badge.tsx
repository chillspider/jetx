import { useNavigation } from '@react-navigation/native';
import { Button, makeStyles, Text, useTheme } from '@rneui/themed';
import { isNotNil } from 'ramda';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Path, Svg } from 'react-native-svg';
import Toast from 'react-native-toast-message';
import Icon from 'react-native-vector-icons/Feather';

import IcCar from '@/assets/svgs/profile/ic_profile_car.svg';
import { Box, Dialog } from '@/components';
import { useVehicleContext } from '@/core/contexts/vehicle-context';
import { useDeleteVehicle } from '@/core/hooks/useVehicles';
import { VehicleDto } from '@/models/vehicle/vehicle.dto';
import { MainNavNavigationProp } from '@/types/navigation';

import VehicleItem from './vehicle-item';

const VehicleBadgeView: React.FC = () => {
	const navigation = useNavigation<MainNavNavigationProp<'Profile'>>();

	const navigationNewVehicle = useCallback(() => {
		navigation.navigate('CreateVehicle');
	}, [navigation]);

	const {
		theme: { colors },
	} = useTheme();

	const styles = useStyles();

	const { vehicles } = useVehicleContext();

	const { t } = useTranslation();

	return (
		<View style={styles.container}>
			<Box flexDirection="row" alignItems="center">
				<IcCar />
				<Box width={8} />
				<Text>{t('vehicle.myVehicle')}</Text>
			</Box>
			<VehicleListView vehicles={vehicles || []} />
			<Button
				color={colors.neutral200}
				title={
					<Box flexDirection="row" alignItems="center">
						<Text body2>{t('vehicle.create')}</Text>
						<Box width={4} />
						<Icon name="plus" size={16} color={colors.neutral800} />
					</Box>
				}
				onPress={navigationNewVehicle}
			/>
		</View>
	);
};

type ListProps = {
	vehicles: VehicleDto[];
};

const VehicleListView: React.FC<ListProps> = ({ vehicles = [] }) => {
	const styles = useStyles();

	const navigation = useNavigation<MainNavNavigationProp<'Profile'>>();
	const [deleteVehicle, setDeleteVehicle] = useState<VehicleDto | undefined>(undefined);

	const { t } = useTranslation();

	const { refetch } = useVehicleContext();

	const mutation = useDeleteVehicle({
		onError: () => {
			Toast.show({
				type: 'error',
				text1: t('notificationTitle'),
				text2: t('networkError'),
			});
		},
		onSuccess: () => {
			refetch();
		},
	});

	const navigationDetail = useCallback(
		(vehicle: VehicleDto) => {
			navigation.navigate('Vehicle', {
				vehicle,
			});
		},
		[navigation],
	);

	const renderRightActions = useCallback(
		(item: VehicleDto) => (
			<Pressable
				onPress={() => {
					setDeleteVehicle(item);
				}}
			>
				<View style={styles.deleteButton}>
					<View style={styles.deleteBg} />
					<IconDelete />
				</View>
			</Pressable>
		),
		[styles.deleteBg, styles.deleteButton],
	);

	const onDeleteVehicle = useCallback(() => {
		if (isNotNil(deleteVehicle)) {
			mutation.mutate({ id: deleteVehicle?.id });
			setDeleteVehicle(undefined);
		}
	}, [deleteVehicle, mutation]);

	const onCloseDeleteVehicle = useCallback(() => {
		setDeleteVehicle(undefined);
	}, []);

	const renderItem = useCallback(
		({ item }: { item: VehicleDto }) => {
			return (
				<Swipeable
					renderRightActions={() => {
						return renderRightActions(item);
					}}
					overshootRight={false}
					key={`swipe-${item.id}`}
				>
					<Pressable
						onPress={() => {
							navigationDetail(item);
						}}
					>
						<VehicleItem data={item} />
					</Pressable>
				</Swipeable>
			);
		},
		[navigationDetail, renderRightActions],
	);

	const renderEmpty = useCallback(() => {
		return (
			<Box py={16} justifyContent="center" alignSelf="center">
				<Text body2 style={styles.empty}>
					{t('vehicle.empty')}
				</Text>
			</Box>
		);
	}, [styles.empty, t]);

	return (
		<View style={styles.listView}>
			{/* <FlatList
				showsVerticalScrollIndicator={false}
				style={styles.list}
				data={vehicles}
				renderItem={renderItem}
				ListEmptyComponent={renderEmpty}
				ItemSeparatorComponent={() => <Box height={8} />}
			/> */}

			<ScrollView showsVerticalScrollIndicator={false} style={styles.list}>
				{vehicles.length > 0
					? vehicles.map((item, index) => (
							<React.Fragment key={item.id || index}>
								{renderItem({ item })}
								{index < vehicles.length - 1 && <Box height={8} />}
							</React.Fragment>
					  ))
					: renderEmpty()}
			</ScrollView>

			{isNotNil(deleteVehicle) && (
				<Dialog
					isVisible={isNotNil(deleteVehicle)}
					title={t('dialog.deleteVehicle.title')}
					description={t('dialog.deleteVehicle.description')}
					onClosed={onCloseDeleteVehicle}
					onConfirm={onDeleteVehicle}
					confirmLabel={t('dialog.deleteVehicle.confirmLabel')}
					closeLabel={t('dialog.deleteVehicle.closeLabel')}
				/>
			)}
		</View>
	);
};

const IconDelete = () => {
	return (
		<Svg width="16" height="16" viewBox="0 0 16 16" fill="none">
			<Path
				d="M6.33339 1.33331C6.17556 1.33335 6.02285 1.38937 5.90245 1.49142C5.78204 1.59346 5.70174 1.73491 5.67584 1.8906L5.43495 3.33331H5.33339H2.43886C2.36771 3.3217 2.29516 3.3217 2.22401 3.33331H1.33339C1.24505 3.33206 1.15734 3.34838 1.07536 3.38133C0.993381 3.41427 0.918767 3.46318 0.855854 3.52521C0.79294 3.58724 0.742983 3.66115 0.708885 3.74266C0.674786 3.82416 0.657227 3.91163 0.657227 3.99998C0.657227 4.08833 0.674786 4.1758 0.708885 4.2573C0.742983 4.33881 0.79294 4.41272 0.855854 4.47475C0.918767 4.53678 0.993381 4.58569 1.07536 4.61863C1.15734 4.65157 1.24505 4.6679 1.33339 4.66665H1.70709L2.22141 12.7838C2.28396 13.8343 3.16526 14.6666 4.2175 14.6666H11.7826C12.8348 14.6666 13.7162 13.8343 13.7787 12.7838L14.293 4.66665H14.6667C14.7551 4.6679 14.8428 4.65157 14.9248 4.61863C15.0067 4.58569 15.0813 4.53678 15.1443 4.47475C15.2072 4.41272 15.2571 4.33881 15.2912 4.2573C15.3253 4.1758 15.3429 4.08833 15.3429 3.99998C15.3429 3.91163 15.3253 3.82416 15.2912 3.74266C15.2571 3.66115 15.2072 3.58724 15.1443 3.52521C15.0813 3.46318 15.0067 3.41427 14.9248 3.38133C14.8428 3.34838 14.7551 3.33206 14.6667 3.33331H13.7787C13.7063 3.32127 13.6324 3.32127 13.56 3.33331H10.6667H10.5652L10.3243 1.8906C10.2984 1.73491 10.2181 1.59346 10.0977 1.49142C9.97726 1.38937 9.82455 1.33335 9.66672 1.33331H6.33339ZM6.89849 2.66665H9.10162L9.21229 3.33331H6.78782L6.89849 2.66665ZM3.04302 4.66665H5.33339H6.00005H9.99615H10.6667H12.9571L12.448 12.7031C12.448 12.7035 12.448 12.704 12.448 12.7044C12.4265 13.0646 12.1424 13.3333 11.7826 13.3333H4.2175C3.85774 13.3333 3.57359 13.0646 3.55214 12.7044C3.55214 12.704 3.55214 12.7035 3.55214 12.7031L3.04302 4.66665ZM5.3412 5.99087C5.24819 5.98964 5.15596 6.00788 5.07042 6.04443C4.98489 6.08098 4.90795 6.13502 4.84455 6.20309C4.78114 6.27115 4.73269 6.35172 4.70229 6.43963C4.67188 6.52754 4.66021 6.62083 4.66802 6.71352L5.00136 11.3802C5.00749 11.4676 5.03078 11.5529 5.06989 11.6313C5.10901 11.7097 5.16318 11.7796 5.22933 11.8371C5.29547 11.8945 5.37228 11.9384 5.45537 11.9661C5.53847 11.9939 5.62622 12.005 5.71361 11.9989C5.801 11.9927 5.88633 11.9694 5.96471 11.9303C6.04309 11.8911 6.11299 11.8369 6.17043 11.7708C6.22786 11.7046 6.2717 11.6278 6.29943 11.5447C6.32717 11.4616 6.33827 11.3738 6.33209 11.2864L5.99875 6.61977C5.98918 6.45115 5.91598 6.29245 5.79393 6.17572C5.67188 6.05899 5.51008 5.99292 5.3412 5.99087ZM7.98964 5.99087C7.81305 5.99363 7.64478 6.06633 7.52175 6.19303C7.39871 6.31972 7.33097 6.49006 7.33339 6.66665V11.3333C7.33214 11.4217 7.34846 11.5094 7.3814 11.5913C7.41434 11.6733 7.46325 11.7479 7.52528 11.8108C7.58731 11.8738 7.66123 11.9237 7.74273 11.9578C7.82424 11.9919 7.9117 12.0095 8.00005 12.0095C8.0884 12.0095 8.17587 11.9919 8.25738 11.9578C8.33888 11.9237 8.4128 11.8738 8.47483 11.8108C8.53686 11.7479 8.58577 11.6733 8.61871 11.5913C8.65165 11.5094 8.66797 11.4217 8.66672 11.3333V6.66665C8.66794 6.57745 8.65125 6.48892 8.61764 6.4063C8.58403 6.32367 8.53418 6.24863 8.47105 6.18561C8.40791 6.1226 8.33277 6.07289 8.25008 6.03944C8.16739 6.00599 8.07883 5.98947 7.98964 5.99087ZM10.6381 5.99087C10.4728 5.99805 10.3162 6.06639 10.1985 6.18262C10.0809 6.29884 10.0106 6.45464 10.0014 6.61977L9.66802 11.2864C9.66184 11.3738 9.67294 11.4616 9.70068 11.5447C9.72841 11.6278 9.77225 11.7046 9.82968 11.7708C9.88712 11.8369 9.95702 11.8911 10.0354 11.9303C10.1138 11.9694 10.1991 11.9927 10.2865 11.9989C10.3739 12.005 10.4616 11.9939 10.5447 11.9661C10.6278 11.9384 10.7046 11.8945 10.7708 11.8371C10.8369 11.7796 10.8911 11.7097 10.9302 11.6313C10.9693 11.5529 10.9926 11.4676 10.9988 11.3802L11.3321 6.71352C11.3401 6.61904 11.3279 6.52392 11.2963 6.43452C11.2647 6.34513 11.2143 6.26351 11.1486 6.19511C11.083 6.12672 11.0034 6.07312 10.9154 6.0379C10.8274 6.00268 10.7328 5.98664 10.6381 5.99087Z"
				fill="white"
			/>
		</Svg>
	);
};

const useStyles = makeStyles(({ colors }) => ({
	container: {
		backgroundColor: colors.neutral100,
		borderRadius: 12,
		padding: 8,
	},
	empty: {
		color: colors.neutral400,
	},
	list: {
		paddingVertical: 16,
	},
	deleteButton: {
		backgroundColor: colors.red,
		justifyContent: 'center',
		alignItems: 'center',
		width: 75,
		height: '100%',
		borderTopRightRadius: 12,
		borderBottomRightRadius: 12,
	},
	deleteBg: {
		backgroundColor: colors.red,
		justifyContent: 'center',
		alignItems: 'center',
		width: 24,
		height: '100%',
		borderTopRightRadius: 12,
		borderBottomRightRadius: 12,
		position: 'absolute',
		left: -12,
		top: 0,
		bottom: 0,
	},
	listView: {
		maxHeight: 250,
	},
}));

export default VehicleBadgeView;
