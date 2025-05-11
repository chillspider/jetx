import { Button } from "@/components/ui/button";
import { useCarDetectorContext } from "@/contexts/car-detector.context";
import { useCallback, useRef, useState } from "react";
import Webcam from "react-webcam";
import { toast } from "sonner";
import DialogDetectResult from "./dialog-result";
import { Label } from "@/components/ui/label";
import { Camera, RotateCcw } from "lucide-react";
import {
	analyzeCar,
	createCarDetector,
} from "@/actions/detector/detector.action";
import { isActionSuccessful, resolveErrorMessage } from "@/actions/safe-action";

export default function ImageStep() {
	const [loading, setLoading] = useState(false);
	const [image, setImage] = useState<string | null>(null);

	const {
		order,
		car,
		setCar,
		onClear,
		setLoading: setLoadingContext,
	} = useCarDetectorContext();

	const webcamRef = useRef<Webcam>(null);
	const capture = useCallback(() => {
		const imageSrc = webcamRef.current?.getScreenshot();

		if (imageSrc) {
			setImage(imageSrc);
		}
	}, [webcamRef]);

	const retake = useCallback(() => {
		setImage(null);
	}, []);

	const handleAnalyzeImage = useCallback(async () => {
		if (!image) return;

		setLoading(true);

		try {
			const result = await analyzeCar({ image });

			if (isActionSuccessful(result)) {
				setCar(result.data);
			} else {
				throw Error(result?.serverError);
			}
		} catch (error) {
			throw error;
		} finally {
			setLoading(false);
		}
	}, [image, setCar]);

	const handleSubmit = () => {
		if (!image) return;

		toast.promise(handleAnalyzeImage, {
			loading: "Đang phân tích hình ảnh...",
			success: "Phân tích hình ảnh thành công",
			error: (error) =>
				resolveErrorMessage(error, "Phân tích hình ảnh thất bại"),
		});
	};

	const sendCarData = useCallback(async () => {
		if (!car || !order || !image) {
			throw Error("Không tìm thấy dữ liệu");
		}

		try {
			setLoadingContext(true);

			const result = await createCarDetector({
				req: {
					car,
					orderId: order.id,
					deviceId: order.deviceId ?? "",
					customerId: order.customerId ?? "",
				},
				image,
			});

			if (isActionSuccessful(result)) {
				onClear();
				return true;
			} else {
				throw Error(result?.serverError);
			}
		} catch (error) {
			throw error;
		} finally {
			setLoadingContext(false);
		}
	}, [car, order, image, onClear, setLoadingContext]);

	const handleSendCarData = async () => {
		toast.promise(sendCarData, {
			loading: "Đang gửi dữ liệu xe...",
			success: "Gửi dữ liệu xe thành công",
			error: (error) => resolveErrorMessage(error, "Gửi dữ liệu xe thất bại"),
		});
	};

	const handleCancelCarData = useCallback(async () => {
		if (!car) return;

		setCar(null);
		setImage(null);
	}, [car, setCar]);

	return (
		<>
			<DialogDetectResult
				open={!!car}
				onSubmit={handleSendCarData}
				onCancel={handleCancelCarData}
			/>
			<section className='w-full h-full flex justify-center items-start'>
				<div className='max-w-[600px] w-full h-full flex flex-col items-center justify-center gap-4'>
					<Label className='text-xl font-medium pt-4'>
						Chụp ảnh xe và biển số
					</Label>
					<div className='w-full flex-1 h-full relative'>
						{image ? (
							// eslint-disable-next-line @next/next/no-img-element
							<img
								src={image}
								alt='Car'
								className='w-full h-full object-cover'
							/>
						) : (
							<Webcam
								ref={webcamRef}
								videoConstraints={{ facingMode: "environment" }}
								screenshotFormat='image/png'
								screenshotQuality={1}
								className='w-full h-full object-cover'
							/>
						)}
						<div className='w-full absolute bottom-0 left-0 right-0 flex gap-4 p-4 items-end'>
							<div className='flex-1'></div>
							<div className='flex-1 flex items-center justify-center'>
								<Button
									className='h-18 w-18 rounded-full !bg-black/50'
									onClick={capture}
									disabled={!!image}>
									<Camera className='!w-8 !h-8' color='white' />
								</Button>
							</div>
							<div className='flex-1 flex  justify-end'>
								<Button
									className='h-14 w-14 rounded-full !bg-black/50'
									onClick={retake}
									disabled={!image || loading}>
									<RotateCcw className='!w-6 !h-6' color='white' />
								</Button>
							</div>
						</div>
					</div>
					<div className='w-full flex gap-4'>
						<Button className='flex-1' onClick={onClear} variant='secondary'>
							Quay lại
						</Button>
						<Button
							className='flex-1'
							disabled={!image || loading}
							onClick={handleSubmit}>
							Xác nhận
						</Button>
					</div>
				</div>
			</section>
		</>
	);
}
