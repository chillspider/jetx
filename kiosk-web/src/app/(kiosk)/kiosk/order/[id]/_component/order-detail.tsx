"use client";

import { getKioskOrder } from "@/actions/kiosk/kiosk.action";
import washingAnimation from "@/animations/washing.json";
import { LazyLottie } from "@/components/lottie";
import { QRCode } from "@/components/qr-code";
import { TaskStepHeading } from "@/components/step-title";
import { Label } from "@/components/ui/label";
import { ORDER_POLLING_INTERVAL, PAYMENT_SESSION } from "@/constants";
import { MQTT_TOPICS } from "@/constants/mqtt";
import { useKioskContext } from "@/contexts/kiosk/kiosk.context";
import { useBoolean } from "@/hooks/use-boolean";
import { useInterval } from "@/hooks/use-interval";
import { decryptJson } from "@/libs/encrypt";
import {
	formatCurrency,
	isOrderFinalized,
	OrderStatusHelper,
	safeJsonParse,
} from "@/libs/helpers";
import useSubscription from "@/libs/mqtt/use-subscription";
import { Routes } from "@/libs/routes";
import { NotificationType, OrderEventDto } from "@/models/order-event.dto";
import { OrderDto, OrderStatusEnum } from "@/models/order.dto";
import { QRPaymentDto } from "@/models/qr-payment.dto";
import { isBrowser } from "@/utils/ssr";
import dayjs from "dayjs";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

export default function KioskOrderDetail({ order }: { order: OrderDto }) {
	const router = useRouter();

	const { profile, payment, setPayment } = useKioskContext();
	const [status, setStatus] = useState<OrderStatusEnum>(order.status);
	const [isLoaded, { setTrue: setLoaded }] = useBoolean(false);
	const { message: orderMsg } = useSubscription(MQTT_TOPICS.ORDER(order.id));

	useEffect(() => {
		initial();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const initial = async () => {
		if (!isBrowser) return;

		if (!payment) {
			const encrypted = sessionStorage.getItem(PAYMENT_SESSION);
			const cachePayment = await decryptJson<QRPaymentDto>(encrypted);
			if (cachePayment?.orderId === order.id) {
				setPayment(cachePayment);
			}
		}
		setLoaded();
	};

	const onBack = useCallback(() => {
		setPayment(null);
		router.replace(Routes.Kiosk);
	}, [setPayment, router]);

	useEffect(() => {
		const orderEvent = safeJsonParse<OrderEventDto>(
			orderMsg?.message?.toString()
		);

		if (orderEvent?.data?.type === NotificationType.ORDER) {
			const order = orderEvent?.data?.data;
			if (order) {
				setStatus(order.status);
			}
		}
	}, [orderMsg]);

	useEffect(() => {
		if (isOrderFinalized(status)) {
			const { message, isError } = OrderStatusHelper[status];
			if (isError) {
				toast.error(message);
			} else {
				toast.success(message);
			}
			onBack();
		}

		if (isLoaded && (!status || status === OrderStatusEnum.DRAFT) && !payment) {
			onBack();
		}
	}, [onBack, status, payment, isLoaded]);

	useInterval(async () => {
		const res = await getKioskOrder(order.id);
		if (res?.data) {
			setStatus(res.data.status);
		}
	}, ORDER_POLLING_INTERVAL);

	const OrderContent = (): React.ReactNode => {
		if (status === OrderStatusEnum.PENDING) {
			return (
				<Label className='text-3xl text-rose-600'>
					{OrderStatusHelper[status].message}
				</Label>
			);
		}

		if (status === OrderStatusEnum.PROCESSING) {
			return (
				<div className='flex flex-col items-center justify-center'>
					<Label className='text-3xl text-rose-600'>
						{OrderStatusHelper[status].message}
					</Label>
					<LazyLottie
						animationData={washingAnimation}
						loop={true}
						className='max-w-[400px]'
					/>
				</div>
			);
		}

		return (
			<>
				<TaskStepHeading
					title='Xin chào quý khách'
					taskTitle={`${
						profile?.station?.name ?? "JETX"
					} mời quý khách quét mã QR để thanh
						toán`}
				/>
				{order?.grandTotal && (
					<Label className='text-4xl text-rose-600'>
						{formatCurrency(order.grandTotal)}
					</Label>
				)}
				{(!status || status === OrderStatusEnum.DRAFT) && payment && (
					<QRCode
						qrCode={{
							data: payment?.qrCode || payment?.endpoint,
							expiredAt:
								payment?.expiredAt || dayjs().add(5, "minutes").toDate(),
						}}
						onComplete={onBack}
					/>
				)}
			</>
		);
	};

	return (
		<section className='flex-1 flex items-center justify-center'>
			<div className='max-w-[800px] w-full h-full flex flex-col items-center justify-center gap-8'>
				<OrderContent />
			</div>
		</section>
	);
}
