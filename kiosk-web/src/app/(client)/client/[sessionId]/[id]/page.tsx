"use client";

import { getClientOrder } from "@/actions/client/kiosk-client.action";
import washFailedAnimation from "@/animations/wash-failed.json";
import washSuccessAnimation from "@/animations/wash-success.json";
import washingAnimation from "@/animations/washing.json";
import { LazyLottie } from "@/components/lottie";
import { QRCode } from "@/components/qr-code";
import { Spinner } from "@/components/spinner";
import { TaskStepHeading } from "@/components/step-title";
import { Label } from "@/components/ui/label";
import { MQTT_TOPICS, ORDER_POLLING_INTERVAL } from "@/constants";
import { useKioskClientContext } from "@/contexts/client/kiosk-client.context";
import { useInterval } from "@/hooks/use-interval";
import {
	formatCurrency,
	isOrderFinalized,
	OrderStatusHelper,
	safeJsonParse,
} from "@/libs/helpers";
import useSubscription from "@/libs/mqtt/use-subscription";
import { cn } from "@/libs/utils";
import { NotificationType, OrderEventDto } from "@/models/order-event.dto";
import { OrderDto, OrderStatusEnum } from "@/models/order.dto";
import dayjs from "dayjs";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import StationLabel from "../_component/station-label";

export default function ClientOrderPage() {
	const { id } = useParams<{ id: string }>();
	const [order, setOrder] = useState<OrderDto>();
	const { payment } = useKioskClientContext();

	const status = useMemo(() => order?.status, [order]);
	const isFinalized = useMemo(() => isOrderFinalized(status), [status]);

	useInterval(
		async () => {
			const res = await getClientOrder(id);
			if (res?.data) setOrder(res.data);
		},
		isFinalized ? null : ORDER_POLLING_INTERVAL,
		{ immediate: true }
	);

	const { message: orderMsg, unsubscribe } = useSubscription(
		MQTT_TOPICS.ORDER(id)
	);

	useEffect(() => {
		if (isFinalized) unsubscribe();
	}, [isFinalized, unsubscribe]);

	useEffect(() => {
		const orderEvent = safeJsonParse<OrderEventDto>(
			orderMsg?.message?.toString()
		);
		if (orderEvent?.data?.type === NotificationType.ORDER) {
			setOrder(orderEvent.data.data);
		}
	}, [orderMsg]);

	const OrderContent = () => {
		const isError = OrderStatusHelper[status]?.isError;
		const message = OrderStatusHelper[status]?.message;

		if (status === OrderStatusEnum.DRAFT) {
			return (
				<>
					{order?.grandTotal && (
						<Label className='text-4xl text-rose-600'>
							{formatCurrency(order.grandTotal)}
						</Label>
					)}
					{payment?.orderId === id && (
						<QRCode
							qrCode={{
								data: payment.qrCode || payment.endpoint,
								expiredAt:
									payment.expiredAt || dayjs().add(5, "minutes").toDate(),
							}}
						/>
					)}
				</>
			);
		}

		if (status === OrderStatusEnum.PROCESSING) {
			return (
				<>
					<Label className='text-3xl text-center text-rose-600'>
						{message}
					</Label>
					<LazyLottie
						animationData={washingAnimation}
						loop
						className='max-w-[400px]'
					/>
				</>
			);
		}

		if (isOrderFinalized(status)) {
			return (
				<LazyLottie
					loop={false}
					animationData={isError ? washFailedAnimation : washSuccessAnimation}
					className='max-w-[600px]'
				/>
			);
		}

		return <Label className={cn("text-3xl text-center")}>{message}</Label>;
	};

	if (!status) return <Spinner />;

	return (
		<section className='flex-1 flex items-center justify-center py-10'>
			<div className='max-w-[800px] w-full h-full flex flex-col items-center justify-center gap-8'>
				<StationLabel incrementId={order?.incrementId} />
				<div className='flex-1 flex w-full flex-col gap-8 items-center justify-center'>
					{status === OrderStatusEnum.DRAFT && (
						<TaskStepHeading
							title='Xin chào quý khách'
							taskTitle={OrderStatusHelper[status].message}
							size='sm'
						/>
					)}
					<OrderContent />
				</div>
			</div>
		</section>
	);
}
