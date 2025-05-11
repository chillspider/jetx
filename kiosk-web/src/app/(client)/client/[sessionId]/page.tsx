"use client";

import { useKioskClientContext } from "@/contexts/client/kiosk-client.context";
import { ParkingAlignmentStep } from "./_component/parking-alignment-step";
import { Spinner } from "@/components/spinner";
import { useState } from "react";
import { OrderStep } from "./_component/order-step";
import { useParams, useRouter } from "next/navigation";
import { createPayment } from "@/actions/client/kiosk-client.action";
import { resolveErrorMessage } from "@/libs/safe-action";
import { toast } from "sonner";
import { Routes } from "@/libs/routes";
import StationLabel from "./_component/station-label";

enum Step {
	PARKING_ALIGNMENT = 0,
	ORDER = 1,
}

export default function KioskClientPage() {
	const router = useRouter();

	const { sessionId } = useParams<{ sessionId: string }>();
	const { device, station, isLoading, setPayment } = useKioskClientContext();

	const [step, setStep] = useState<Step>(Step.PARKING_ALIGNMENT);

	const onPayment = async (modeId: string) => {
		const result = await createPayment({ modeId });
		if (result?.data) {
			setPayment(result?.data);
			router.replace(Routes.ClientOrder(sessionId, result?.data?.orderId));
			return;
		}

		toast.error(resolveErrorMessage(result, "Thanh toán không thành công!"));
	};

	if (isLoading) {
		return <Spinner />;
	}

	if (!device || !station) {
		return <></>;
	}

	return (
		<section className='flex-1 flex items-center justify-center py-10'>
			<div className='max-w-[800px] w-full h-full flex flex-col items-center gap-8'>
				<StationLabel />
				<div className='flex-1 flex w-full flex-col gap-8 items-center justify-center'>
					{step === Step.PARKING_ALIGNMENT && (
						<ParkingAlignmentStep onNextStep={() => setStep(Step.ORDER)} />
					)}
					{step === Step.ORDER && <OrderStep onPayment={onPayment} />}
				</div>
			</div>
		</section>
	);
}
