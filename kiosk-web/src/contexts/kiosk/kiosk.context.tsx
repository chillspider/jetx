"use client";

import { kioskSignOut } from "@/actions/auth/auth.action";
import { kioskHeartbeat, refreshKioskQR } from "@/actions/kiosk/kiosk.action";
import {
	HEARTBEAT_INTERVAL,
	PAYMENT_SESSION,
	QR_POLLING_INTERVAL,
} from "@/constants";
import { MQTT_TOPICS } from "@/constants/mqtt";
import { useBoolean } from "@/hooks/use-boolean";
import { useWakeLock } from "@/hooks/use-wake-lock";
import { encryptJson } from "@/libs/encrypt";
import { safeJsonParse } from "@/libs/helpers";
import useSubscription from "@/libs/mqtt/use-subscription";
import { Routes } from "@/libs/routes";
import { MqttEvent } from "@/models/mqtt-event.dto";
import { QRPaymentDto } from "@/models/qr-payment.dto";
import { KioskProfileDto } from "@/models/responses/kiosk-profile.response";
import { KioskSessionQRDto } from "@/models/responses/kiosk-session-qr.response";
import { timeDiffInSec } from "@/utils/date";
import { isBrowser } from "@/utils/ssr";
import { Query, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
	createContext,
	PropsWithChildren,
	useContext,
	useEffect,
	useState,
} from "react";

type KioskContextType = {
	isLoading: boolean;
	payment: QRPaymentDto;
	profile?: KioskProfileDto;
	qrCode: KioskSessionQRDto;
	setPayment: (payment: QRPaymentDto) => void;
};

export const KioskContext = createContext<KioskContextType | string>(
	"useKioskContext should be used inside KioskProvider"
);

export type KioskProviderProps = PropsWithChildren<{
	profile: KioskProfileDto;
}>;

export const KioskProvider: React.FC<KioskProviderProps> = ({
	children,
	profile,
}) => {
	const [payment, setPayment] = useState<QRPaymentDto>();
	const [isLoading, { setFalse: setLoaded }] = useBoolean(true);

	const router = useRouter();

	// Keep the screen awake
	const { request: requestWakeLock } = useWakeLock();

	useEffect(() => {
		initial();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const initial = async () => {
		if (!isBrowser) return;

		if (!profile) {
			await kioskSignOut();
		}

		await requestWakeLock();
		setLoaded();
	};

	const retrieveRemainingTime = (
		data: Query<KioskSessionQRDto, Error, KioskSessionQRDto, string[]>
	) => {
		const expiredAt = data?.state?.data?.expiredAt;
		if (!expiredAt) return 0;

		const diffSeconds = timeDiffInSec(expiredAt);
		return diffSeconds > 0 ? diffSeconds : 0;
	};

	// Refresh QR Code
	const { data: qrCode } = useQuery({
		queryKey: ["kiosk-session-qr"],
		queryFn: async () => {
			const response = await refreshKioskQR();
			if (response?.data) return response.data;
			throw new Error("unknown");
		},
		retry: true,
		refetchIntervalInBackground: true,
		refetchInterval: (data) => {
			const remainingTime = retrieveRemainingTime(data);
			return remainingTime > 0 ? remainingTime * 1000 : QR_POLLING_INTERVAL;
		},
		refetchOnReconnect: (data) => {
			const remainingTime = retrieveRemainingTime(data);
			return remainingTime <= 0;
		},
		refetchOnWindowFocus: (data) => {
			const remainingTime = retrieveRemainingTime(data);
			return remainingTime <= 0;
		},
	});

	// Heartbeat to keep the connection alive
	const {} = useQuery({
		queryKey: ["kiosk-heartbeat"],
		queryFn: () => kioskHeartbeat(),
		refetchInterval: HEARTBEAT_INTERVAL,
		refetchIntervalInBackground: true,
		refetchOnReconnect: true,
		refetchOnWindowFocus: true,
		enabled: !!profile,
	});

	// Subscribe to payment events
	const { message: paymentEvent } = useSubscription(
		MQTT_TOPICS.KIOSK_PAYMENT(profile?.device?.id)
	);

	useEffect(() => {
		if (paymentEvent) {
			const event = safeJsonParse<MqttEvent<QRPaymentDto>>(
				paymentEvent.message?.toString()
			);

			if (event?.data) {
				setPayment(event.data);
				saveSessionPayment(event.data);
				router.replace(Routes.KioskOrder(event.data.orderId));
			}
		}
	}, [paymentEvent, router]);

	const saveSessionPayment = async (payment: QRPaymentDto) => {
		const encrypted = await encryptJson(payment);
		sessionStorage.setItem(PAYMENT_SESSION, encrypted);
	};

	const value: KioskContextType = {
		isLoading,
		payment,
		profile,
		qrCode,
		setPayment,
	};

	return <KioskContext.Provider {...{ value, children }} />;
};

export const useKioskContext = () => {
	const c = useContext(KioskContext);

	if (typeof c === "string") {
		throw Error(c);
	}

	return c;
};
