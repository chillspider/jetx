"use client";

import { getDeviceStatus } from "@/actions/client/kiosk-client.action";
import { TaskStepHeading } from "@/components/step-title";
import { Label } from "@/components/ui/label";
import { DEVICE_STATUS_POLLING_INTERVAL } from "@/constants";
import {
	DeviceNotAllowStatus,
	MachineAllowStatus,
} from "@/models/device-status.dto";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

type ParkingAlignmentStepProps = {
	onNextStep: () => void;
};

export function ParkingAlignmentStep({
	onNextStep,
}: ParkingAlignmentStepProps) {
	const { data: deviceStatus, isFetched } = useQuery({
		queryKey: ["device-status"],
		queryFn: async () => {
			const response = await getDeviceStatus();
			if (response?.data) {
				return response.data;
			}
			throw new Error("Failed to refresh QR code");
		},
		refetchInterval: DEVICE_STATUS_POLLING_INTERVAL,
		refetchIntervalInBackground: true,
	});

	useEffect(() => {
		if (deviceStatus?.isAllow === MachineAllowStatus.ALLOW) {
			onNextStep();
		}
	}, [deviceStatus, onNextStep]);

	return (
		<section className='flex-1 flex flex-col items-center gap-4'>
			<TaskStepHeading
				title='Xin chào quý khách'
				taskTitle='Vui lòng di chuyển xe vào đúng vị trí rửa'
				size='sm'
			/>
			{isFetched && !deviceStatus && (
				<div className='flex-1 flex flex-col items-center justify-center gap-2'>
					<Label className='text-4xl text-center text-red-500'>
						Không thể kết nối với máy rửa
					</Label>
				</div>
			)}
			{deviceStatus?.isAllow === MachineAllowStatus.NOT_ALLOW && (
				<div className='flex-1 flex flex-col items-center justify-center'>
					<Label className='text-4xl text-center text-red-500'>
						{DeviceNotAllowStatus[deviceStatus?.notAllowType]}
					</Label>
				</div>
			)}
		</section>
	);
}
