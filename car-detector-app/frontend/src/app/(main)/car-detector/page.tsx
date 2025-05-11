"use client";

import {
	CarDetectorProvider,
	CarDetectorStep,
	useCarDetectorContext,
} from "@/contexts/car-detector.context";
import ScannerStep from "./_components/scan-step";
import { Spinner } from "@/components/spinner";
import ImageStep from "./_components/image-step";

const CarDetectorPage = () => {
	const { step, loading } = useCarDetectorContext();

	return (
		<div className='w-full h-full'>
			{loading && <Spinner />}
			{step === CarDetectorStep.SCAN && <ScannerStep />}
			{step === CarDetectorStep.IMAGE && <ImageStep />}
		</div>
	);
};

const CarDetectorWrapper = () => {
	return (
		<CarDetectorProvider>
			<CarDetectorPage />
		</CarDetectorProvider>
	);
};
export default CarDetectorWrapper;
