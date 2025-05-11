import { AxiosError } from 'axios';
import { createQuery } from 'react-query-kit';

import { MachineInfoDto } from '@/models/yigoli/machine-info.dto';
import deviceApi from '@/services/device/device-service';

type Variables = {
	id: string;
};

export const useDeviceStatus = createQuery<MachineInfoDto, Variables, AxiosError>({
	queryKey: ['device-status'],

	fetcher: variables => {
		return deviceApi.getDeviceStatus(variables.id).then(res => res.data);
	},
});
