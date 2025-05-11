"use client";

import { clientSignOut } from "@/actions/auth/auth.action";
import { CLIENT_PAYMENT_SESSION, CLIENT_SESSION } from "@/constants";
import { useBoolean } from "@/hooks/use-boolean";
import { setSession } from "@/libs/cookies";
import { decryptJson, encryptJson } from "@/libs/encrypt";
import { DeviceDto } from "@/models/device.dto";
import { QRPaymentDto } from "@/models/qr-payment.dto";
import { KioskClientProfileResponse } from "@/models/responses/kiosk-client-profile.response";
import { StationDto } from "@/models/station.dto";
import { isBrowser } from "@/utils/ssr";
import {
	createContext,
	PropsWithChildren,
	useContext,
	useEffect,
	useState,
} from "react";
import { toast } from "sonner";

type KioskClientContextType = {
	device: DeviceDto;
	station: StationDto;
	isLoading: boolean;
	payment: QRPaymentDto;
	setPayment: (payment: QRPaymentDto) => void;
};

export const KioskClientContext = createContext<
	KioskClientContextType | string
>("useKioskClientContext should be used inside KioskClientProvider");

export type ClientProviderProps = PropsWithChildren<{
	profile?: KioskClientProfileResponse;
}>;

export const KioskClientProvider: React.FC<ClientProviderProps> = ({
	children,
	profile,
}) => {
	const [isLoading, { setFalse: setLoaded }] = useBoolean(true);
	const [payment, setPayment] = useState<QRPaymentDto>();

	useEffect(() => {
		initial();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const initial = async () => {
		if (!isBrowser) return;

		if (profile) {
			await setSession(CLIENT_SESSION, profile);
			const payment = await getSessionPayment();
			if (payment) {
				setPayment(payment);
			}
		} else {
			toast.error("Phiên thanh toán hết hạn!!!");
			await clientSignOut();
		}

		setLoaded();
	};

	const saveSessionPayment = async (payment: QRPaymentDto) => {
		const encrypted = await encryptJson(payment);
		sessionStorage.setItem(CLIENT_PAYMENT_SESSION, encrypted);
	};

	const getSessionPayment = async () => {
		if (!isBrowser) return;

		const encrypted = sessionStorage.getItem(CLIENT_PAYMENT_SESSION);
		return encrypted ? await decryptJson<QRPaymentDto>(encrypted) : null;
	};

	const handleSetPayment = async (payment: QRPaymentDto) => {
		setPayment(payment);
		saveSessionPayment(payment);
	};

	const value: KioskClientContextType = {
		device: profile?.device,
		station: profile?.station,
		isLoading,
		payment,
		setPayment: handleSetPayment,
	};

	return <KioskClientContext.Provider {...{ value, children }} />;
};

export const useKioskClientContext = () => {
	const c = useContext(KioskClientContext);

	if (typeof c === "string") {
		throw Error(c);
	}

	return c;
};
