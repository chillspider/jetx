"use client";

import { Label } from "@/components/ui/label";
import { useKioskClientContext } from "@/contexts/client/kiosk-client.context";
import { MapPinIcon } from "lucide-react";

type StationLabelProps = {
	incrementId?: number;
};

export default function StationLabel({ incrementId }: StationLabelProps) {
	const { station } = useKioskClientContext();

	if (!station) return <></>;

	return (
		<div className='flex items-center justify-center gap-2'>
			<div className='flex items-center justify-center gap-6 px-2 py-1 rounded-xl border-rose-500 border-1 min-w-[200px]'>
				{incrementId && (
					<Label className='text-lg font-semibold text-rose-500'>
						#{incrementId}
					</Label>
				)}
				<div className='flex items-center justify-center gap-1'>
					<MapPinIcon className='w-4 h-4 text-rose-500' />
					<Label className='text-xl'>{station.name}</Label>
				</div>
			</div>
		</div>
	);
}
