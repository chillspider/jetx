import { AxiosError } from 'axios';
import { createMutation } from 'react-query-kit';

import { DeviceDto } from '@/models/devices/device.dto';
import deviceApi from '@/services/device/device-service';

type Variables = {
	id: string;
};

export const useDevice = createMutation<DeviceDto, Variables, AxiosError>({
	mutationKey: ['checking-device'],
	mutationFn: async variables => {
		return deviceApi.getDevice(variables.id).then(res => res.data);
	},
});
