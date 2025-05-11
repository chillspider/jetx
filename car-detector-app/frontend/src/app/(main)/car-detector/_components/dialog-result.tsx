import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
	CarDetectorStep,
	useCarDetectorContext,
} from "@/contexts/car-detector.context";
import { JSX } from "react";

type DialogDetectResultProps = {
	open: boolean;
	onSubmit: () => void;
	onCancel: () => void;
};

export default function DialogDetectResult({
	open,
	onSubmit,
	onCancel,
}: DialogDetectResultProps) {
	const { car, order, step } = useCarDetectorContext();

	const isScanStep = step === CarDetectorStep.SCAN;

	const RowInfo = ({ label, value }: { label: string; value: string }) => {
		return (
			<div className='flex items-center gap-4 w-full'>
				<Label className='text-left flex-1 text-neutral-500 text-ellipsis'>
					{label}
				</Label>
				<Label className='text-right flex-2 text-ellipsis'>{value}</Label>
			</div>
		);
	};

	const OrderInfo = (): JSX.Element => {
		if (!order) return <></>;

		return (
			<Card className='py-4'>
				<CardContent className='flex flex-col gap-3 px-4'>
					{order.deviceNo && <RowInfo label='Mã máy' value={order.deviceNo} />}
					{order.incrementId && (
						<RowInfo label='Số đơn hàng' value={order.incrementId.toString()} />
					)}
					{order.customerName && (
						<RowInfo label='Khách hàng' value={order.customerName} />
					)}
					{order.customerEmail && (
						<RowInfo label='Email' value={order.customerEmail} />
					)}
				</CardContent>
			</Card>
		);
	};

	const CarInfo = (): JSX.Element => {
		if (!car) return <></>;

		return (
			<Card className='py-4'>
				<CardContent className='flex flex-col gap-3 px-4'>
					{car.plateNumber && (
						<RowInfo label='Biển số' value={car?.plateNumber} />
					)}
					{car.brand && <RowInfo label='Hãng xe' value={car?.brand} />}
					{car.carType && <RowInfo label='Loại xe' value={car?.carType} />}
					{car.color && <RowInfo label='Màu xe' value={car?.color} />}
				</CardContent>
			</Card>
		);
	};

	return (
		<Dialog open={open}>
			<DialogContent className='[&>button]:hidden'>
				<DialogHeader>
					<DialogTitle>Thông tin chi tiết</DialogTitle>
				</DialogHeader>
				<div className='flex flex-col gap-4'>
					<OrderInfo />
					{!isScanStep && <CarInfo />}
				</div>
				<DialogFooter>
					<Button variant='outline' onClick={onCancel}>
						Huỷ bỏ
					</Button>
					<Button type='submit' onClick={onSubmit}>
						Xác nhận
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
