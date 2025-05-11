"use client";

import { Label } from "@/components/ui/label";
import { useInterval } from "@/hooks/use-interval";
import { formatCountdownTime } from "@/libs/helpers";
import { cn } from "@/libs/utils";
import { timeDiffInSec } from "@/utils/date";
import { Loader2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useMemo, useRef, useState } from "react";

type QRCodeProps = {
	qrCode: {
		data: string;
		expiredAt: Date;
	};
	onComplete?: () => void;
};

export const QRCode = ({ qrCode, onComplete }: QRCodeProps) => {
	const [time, setTime] = useState(0);
	const hasCompleted = useRef(false);

	useEffect(() => {
		setTime(timeDiffInSec(qrCode.expiredAt));
		hasCompleted.current = false;
	}, [qrCode]);

	useInterval(
		() => {
			setTime((prev) => {
				if (prev <= 1) {
					if (!hasCompleted.current) {
						hasCompleted.current = true;
						onComplete?.();
					}
					return 0;
				}
				return prev - 1;
			});
		},
		time > 0 ? 1000 : null
	);

	const isExpired = useMemo(() => {
		return time <= 0;
	}, [time]);

	return (
		<div className='flex flex-col items-center justify-center gap-2'>
			<div className='relative'>
				<div className={cn(isExpired && "opacity-70", "transition-opacity")}>
					<QRCodeSVG
						value={qrCode.data}
						className='max-w-full w-[400px] h-[400px]'
					/>
				</div>
				{isExpired && (
					<div className='absolute inset-0 flex items-center justify-center'>
						<Loader2 className='animate-spin' />
					</div>
				)}
			</div>
			<Label className='text-2xl font-bold'>
				{formatCountdownTime(Math.max(time, 0))}
			</Label>
		</div>
	);
};
