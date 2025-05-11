import { head, isNil, isNotEmpty, isNotNil } from 'ramda';
import {
	createContext,
	PropsWithChildren,
	useCallback,
	useContext,
	useEffect,
	useState,
} from 'react';

import { usePaymentMethod } from '@/core/hooks/start-process/usePaymentMethod';
import { DeviceDto } from '@/models/devices/device.dto';
import { ModeDto } from '@/models/devices/mode.dto';
import { isVoucherEnabled, VoucherDto } from '@/models/order/voucher.dto';
import { PaymentMethodModel } from '@/models/payment/payment-method-model';
import { getWashMode } from '@/models/yigoli/wash-mode.enum';
import { getServerTime } from '@/utils/date-utils';

import { useVoucherAll } from '../hooks/useVouchers';

type PaymentContextType = {
	vouchers: VoucherDto[];
	selectedVoucher?: VoucherDto | undefined;

	device?: DeviceDto | undefined;
	setDevice: (device: DeviceDto) => void;
	setSelectedVoucher: (voucher?: VoucherDto) => void;

	paymentMethods: PaymentMethodModel[];
	setPaymentMethod: (method: PaymentMethodModel) => void;
	method?: PaymentMethodModel | undefined;

	washMode?: ModeDto | undefined;
	setWashMode: (mode: ModeDto) => void;

	updateAutoSelectedVoucher: (id: string) => void;
};

export const PaymentContext = createContext<PaymentContextType | string>(
	'usePaymentContext should be used inside PaymentProvider',
);

export const PaymentProvider: React.FC<PropsWithChildren> = ({ children }) => {
	const [device, setDevice] = useState<DeviceDto | undefined>(undefined);

	//! For Vouchers
	const [availableVouchers, setAvailableVouchers] = useState<VoucherDto[]>([]);
	const [selectedVoucher, setSelectedVoucher] = useState<VoucherDto | undefined>(undefined);
	const { data: vouchers } = useVoucherAll();
	const [mode, setMode] = useState<ModeDto | undefined>();

	const updateAutoSelectedVoucher = useCallback(
		(id: string) => {
			const voucher = availableVouchers.find(v => v.id === id);
			setSelectedVoucher(voucher);
		},
		[availableVouchers, setSelectedVoucher],
	);

	useEffect(() => {
		const checkAvailableVouchers = async () => {
			const washMode = getWashMode(mode?.code);

			if (isNil(device) || isNil(washMode)) return;

			const currentTime = await getServerTime();

			const available = vouchers?.filter(voucher =>
				isVoucherEnabled(voucher, currentTime.toDate(), device.id, device.stationId, washMode),
			);

			setAvailableVouchers(available || []);
		};

		checkAvailableVouchers();
	}, [vouchers, device, mode]);

	//! For Payment
	const { data: methods } = usePaymentMethod({ variables: { type: 'default' } });

	const [method, setPaymentMethod] = useState<PaymentMethodModel>();

	useEffect(() => {
		if (isNotNil(methods) && isNotEmpty(methods)) {
			const defaultMethod = methods.find(e => e.isDefault === true);
			setPaymentMethod(defaultMethod || head(methods));
		}
	}, [methods]);

	//! For Wash Mode

	useEffect(() => {
		if (isNil(device)) return;
		const { modes } = device;
		const defaultMode = isNotNil(modes) && isNotEmpty(modes) ? head(modes) : undefined;

		setMode(defaultMode);
	}, [device]);

	const value: PaymentContextType = {
		vouchers: availableVouchers || [],
		device,
		selectedVoucher,
		setDevice,
		setSelectedVoucher,
		paymentMethods: methods || [],
		method,
		setPaymentMethod,

		washMode: mode,
		setWashMode: setMode,

		updateAutoSelectedVoucher,
	};

	return <PaymentContext.Provider {...{ value, children }} />;
};

export const usePaymentContext = () => {
	const c = useContext(PaymentContext);

	if (typeof c === 'string') {
		throw Error(c);
	}

	return c;
};
