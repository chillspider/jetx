import { AxiosError } from 'axios';
import { createMutation } from 'react-query-kit';

import { UpdateUserDto } from '@/models/auth/request/update-user.dto';
import { UserPayloadDto } from '@/models/auth/response/user-payload.dto';
import userApi from '@/services/auth/auth-services';

export const useUpdateProfile = createMutation<UserPayloadDto, UpdateUserDto, AxiosError>({
	mutationFn: async variables => {
		return userApi.editProfile(variables).then(res => res.data);
	},
});
