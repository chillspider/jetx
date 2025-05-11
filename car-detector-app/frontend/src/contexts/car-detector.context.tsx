"use client";

import { CarModelDto } from "@/models/car-model.dto";
import { OrderInfoDto } from "@/models/order-info.dto";
import {
	createContext,
	PropsWithChildren,
	useCallback,
	useContext,
	useState,
} from "react";

export enum CarDetectorStep {
	SCAN = 0,
	IMAGE = 1,
}

type CarDetectorContextType = {
	step: CarDetectorStep;
	car: CarModelDto | null;
	loading: boolean;
	order: OrderInfoDto | null;
	setStep: (step: CarDetectorStep) => void;
	setCar: (car: CarModelDto | null) => void;
	setOrder: (order: OrderInfoDto | null) => void;
	onClear: () => void;
	setLoading: (loading: boolean) => void;
};

export const CarDetectorContext = createContext<
	CarDetectorContextType | string
>("useCarDetectorContext should be used inside CarDetectorProvider");

export const CarDetectorProvider: React.FC<PropsWithChildren> = ({
	children,
}) => {
	const [step, setStep] = useState<CarDetectorStep>(CarDetectorStep.SCAN);
	const [loading, setLoading] = useState<boolean>(false);

	const [car, setCar] = useState<CarModelDto | null>(null);
	const [order, setOrder] = useState<OrderInfoDto | null>(null);

	const onClear = useCallback(() => {
		setStep(CarDetectorStep.SCAN);
		setCar(null);
		setOrder(null);
		setLoading(false);
	}, []);

	const value: CarDetectorContextType = {
		step,
		car,
		loading,
		order,
		setStep,
		setCar,
		setOrder,
		onClear,
		setLoading,
	};

	return <CarDetectorContext.Provider {...{ value, children }} />;
};

export const useCarDetectorContext = () => {
	const c = useContext(CarDetectorContext);

	if (typeof c === "string") {
		throw Error(c);
	}

	return c;
};
