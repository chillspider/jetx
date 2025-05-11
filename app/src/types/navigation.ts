import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps, createNavigationContainerRef } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { DeviceDto } from '@/models/devices/device.dto';
import { OrderDto } from '@/models/order/order.dto';
import { VoucherDto } from '@/models/order/voucher.dto';
import { PackageDto } from '@/models/package/package.dto';
import { VehicleDto } from '@/models/vehicle/vehicle.dto';
import { WashMode } from '@/models/yigoli/wash-mode.enum';

export const navigatorRef = createNavigationContainerRef<AppStackParamList>();

//! Bottom Tabs
export type MainNavScreenProps<T extends keyof MainNavParamList> = CompositeScreenProps<
	BottomTabScreenProps<MainNavParamList, T>,
	AppScreenProps<'MainTab'>
>;

export type MainNavNavigationProp<T extends keyof MainNavParamList> =
	MainNavScreenProps<T>['navigation'];

export type MainNavRouteProp<T extends keyof MainNavParamList> = MainNavScreenProps<T>['route'];

export type MainNavParamList = {
	Home: undefined;
	Scan: undefined;
	Profile: undefined;
};

export type AppStackParamList = {
	SignIn: undefined;
	MainTab: undefined;
	Account: undefined;
	EditProfile: undefined;
	Support: undefined;
	Voucher: undefined;
	WaitingQR: {
		expiredAt: Date;
		order: OrderDto;
		type: string;
	};
	Payment: {
		uri: string | undefined;
		orderId: string;
		status: string | undefined;
		type: string;
	};
	News: undefined;
	Notification: undefined;
	WebView: {
		uri: string;
		title?: string | undefined;
	};
	History: undefined;
	TermOfUse: undefined;
	Vehicle: {
		vehicle: VehicleDto;
	};
	CreateVehicle: undefined;
	StartProcess: {
		device: DeviceDto;
	};
	Waiting: {
		orderId: string;
	};
	Processing: {
		orderId: string;
	};
	Card: undefined;
	CreatePaymentCard: {
		status: string | undefined;
	};
	OrderVoucher: {
		orderValue: number | undefined;
		onConfirm?: (v?: VoucherDto) => void;
		select?: VoucherDto;
		stationId: string;
		deviceId: string;
		washMode: WashMode;
	};
	About: undefined;
	SupportDetail: {
		id: string;
	};
	Referral: undefined;
	Package: undefined;
	PackagePrePayment: {
		package: PackageDto;
	};
	PackageQRWaiting: {
		qrCode: string;
		expiredAt: Date;
		orderId: string;
		price: number;
	};
	FnbCart: undefined;
	FnbOrderHistory: {
		order: OrderDto;
	};
	FnbProductFilter: undefined;
	ScanVoucherCode: {
		onBack?: (voucher?: VoucherDto) => void;
	};
};

export type AppScreenProps<S extends keyof AppStackParamList = keyof AppStackParamList> =
	NativeStackScreenProps<AppStackParamList, S>;

export type AppNavigationProp<T extends keyof AppStackParamList> = AppScreenProps<T>['navigation'];

export type AppRouteProp<T extends keyof AppStackParamList> = AppScreenProps<T>['route'];
