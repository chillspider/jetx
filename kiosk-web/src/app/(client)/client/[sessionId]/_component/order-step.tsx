import { TaskStepHeading } from "@/components/step-title";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useKioskClientContext } from "@/contexts/client/kiosk-client.context";
import { useBoolean } from "@/hooks/use-boolean";
import { formatCurrency } from "@/libs/helpers";
import { cn } from "@/libs/utils";
import { ClockIcon } from "lucide-react";
import { useMemo, useState } from "react";

type OrderStepProps = {
	onPayment: (modeId: string) => Promise<void>;
};

export function OrderStep({ onPayment }: OrderStepProps) {
	const { device } = useKioskClientContext();
	const [selectedMode, setSelectedMode] = useState<string>(null);
	const [isLoading, { setTrue, setFalse }] = useBoolean(false);

	const modes = useMemo(() => {
		return device?.modes || [];
	}, [device]);

	const onPaymentHandler = async () => {
		setTrue();
		await onPayment(selectedMode);
		setFalse();
	};

	return (
		<section className='flex-1 flex flex-col items-center gap-4 w-full'>
			<TaskStepHeading
				title='Xin chào quý khách'
				taskTitle='Vui lòng chọn chế độ rửa xe'
				size='sm'
			/>
			<div className='flex-1 w-full flex flex-col items-center justify-center gap-2'>
				{modes.map((mode) => (
					<div
						key={mode.id}
						className={cn(
							"p-3 rounded-sm border-2 border-gray-200 w-full flex items-center justify-between gap-8 transition-all",
							mode.id === selectedMode && "border-red-500 border-2 bg-red-50"
						)}
						onClick={() => setSelectedMode(mode.id)}>
						<div className='flex-1 flex items-center justify-between'>
							<div className='flex-1 flex-col items-center justify-between gap-2'>
								<Label className='text-xl'>{mode.name}</Label>
								<div className='flex items-center justify-start gap-2'>
									<Label className='text-lg text-red-500'>
										{formatCurrency(mode.price)}
									</Label>
									{mode.originPrice && mode.originPrice !== mode.price && (
										<Label className='text-sm text-gray-500 line-through'>
											{formatCurrency(mode.originPrice)}
										</Label>
									)}
								</div>
							</div>
							{mode.metadata?.duration && (
								<div className='flex items-center justify-start gap-1'>
									<ClockIcon className='w-4 h-4 text-red-500' />
									<Label className='text-sm text-red-500'>
										{mode.metadata?.duration} phút
									</Label>
								</div>
							)}
						</div>
					</div>
				))}
			</div>
			<Button
				className='w-full'
				size='lg'
				disabled={!selectedMode}
				isLoading={isLoading}
				onClick={() => onPaymentHandler()}>
				Thanh toán
			</Button>
		</section>
	);
}
