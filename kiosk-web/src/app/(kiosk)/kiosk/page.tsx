"use client";

import { QRCode } from "@/components/qr-code";
import { Spinner } from "@/components/spinner";
import { TaskStepHeading } from "@/components/step-title";
import { Skeleton } from "@/components/ui/skeleton";
import { useKioskContext } from "@/contexts/kiosk/kiosk.context";
import { createQRCodeUrl, isProduction } from "@/libs/helpers";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);

export default function KioskPage() {
	const { profile, qrCode, isLoading } = useKioskContext();

	if (isLoading) {
		return <Spinner />;
	}

	if (!profile) {
		return <></>;
	}

	return (
		<section className='flex-1 flex items-center justify-center'>
			<div className='max-w-[800px] w-full h-full flex flex-col items-center justify-center gap-8'>
				<TaskStepHeading
					title='Xin chào quý khách'
					taskTitle={`${
						profile?.station?.name ?? "JETX"
					} mời quý khách quét mã QR để rửa
						xe`}
				/>
				{!isProduction && <p>{qrCode?.sessionId}</p>}
				{qrCode ? (
					<QRCode
						qrCode={{
							data: createQRCodeUrl(qrCode.sessionId),
							expiredAt: qrCode.expiredAt,
						}}
					/>
				) : (
					<Skeleton className='h-[400px] w-[400px] rounded-xs' />
				)}
			</div>
		</section>
	);
}
