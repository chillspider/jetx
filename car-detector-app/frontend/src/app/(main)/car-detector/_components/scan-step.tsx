"use client";

import { Button } from "@/components/ui/button";
import {
	CarDetectorStep,
	useCarDetectorContext,
} from "@/contexts/car-detector.context";
import { Label } from "@radix-ui/react-label";
import { IDetectedBarcode, Scanner } from "@yudiel/react-qr-scanner";
import { PauseIcon, PlayIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import DialogDetectResult from "./dialog-result";
import { getOrderByDeviceId } from "@/actions/detector/detector.action";
import { isActionSuccessful, resolveErrorMessage } from "@/actions/safe-action";

export default function ScannerStep() {
	const [pause, setPause] = useState(false);
	const [loading, setLoading] = useState(false);
	const { order, setOrder, setStep, setCar } = useCarDetectorContext();

	const getDevice = async (deviceId: string) => {
		if (!deviceId) return;

		setPause(true);
		setLoading(true);

		try {
			const result = await getOrderByDeviceId({ deviceId });
			if (isActionSuccessful(result)) {
				setOrder(result.data);
				setCar(null);
			} else {
				throw Error(result?.serverError);
			}
		} catch (error) {
			throw error;
		} finally {
			setLoading(false);
		}
	};

	const handleScanQR = (result: IDetectedBarcode[]) => {
		const deviceId = result?.[0]?.rawValue;
		if (!deviceId) return;

		toast.promise(getDevice(deviceId), {
			loading: "Đang lấy thông tin thiết bị...",
			success: "Thiết bị đã được tìm thấy!",
			error: (error) => resolveErrorMessage(error, "QR code không hợp lệ!"),
		});
	};

	const handleCancel = () => {
		setOrder(null);
		setPause(false);
	};

	const handleNextStep = () => {
		if (!order) return;
		setStep(CarDetectorStep.IMAGE);
	};

	return (
		<>
			<DialogDetectResult
				open={!!order && !loading}
				onSubmit={handleNextStep}
				onCancel={handleCancel}
			/>
			<section className='w-full h-full flex justify-center items-start'>
				<div className='max-w-[600px] w-full h-full flex flex-col items-start justify-center gap-4'>
					<Label className='w-full text-xl font-medium text-center pt-4'>
						Quét mã QR trên máy rửa
					</Label>
					<div className='w-full h-full flex-1 flex items-center justify-center'>
						<div className='w-full aspect-square'>
							<Scanner
								onScan={handleScanQR}
								paused={pause}
								allowMultiple={false}
								formats={["qr_code"]}
								components={{
									audio: false,
									onOff: false,
									torch: true,
									zoom: true,
									finder: true,
								}}
							/>
						</div>
					</div>
					<Button
						onClick={() => setPause(!pause)}
						className='w-full'
						variant='secondary'
						disabled={loading}>
						{pause ? (
							<PlayIcon className='w-4 h-4' />
						) : (
							<PauseIcon className='w-4 h-4' />
						)}
						{pause ? "Tiếp tục" : "Tạm dừng"}
					</Button>
				</div>
			</section>
		</>
	);
}
