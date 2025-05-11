import { AxiosError } from 'axios';
import { createMutation, createQuery } from 'react-query-kit';

import { PaginationRequestDto } from '@/models/commons/pagination-request.dto';
import { CreateVehicleDto } from '@/models/vehicle/request/create-vehicle.dto';
import { UpdateVehicleDto } from '@/models/vehicle/request/update-vehicle.dto';
import { VehicleDto } from '@/models/vehicle/vehicle.dto';
import vehicleApi from '@/services/vehicle/vehicle-service';

export const useVehicles = createQuery<VehicleDto[], PaginationRequestDto, AxiosError>({
	queryKey: ['vehicles'],
	fetcher: async variables => {
		const res = await vehicleApi.getVehicles(variables);
		return res.data.data || [];
	},
});

export const useDeleteVehicle = createMutation<boolean, { id: string }, AxiosError>({
	mutationKey: ['delete-vehicle'],
	mutationFn: async variables => {
		const res = await vehicleApi.deleteVehicle(variables.id);
		return res.data;
	},
});

export const useCreateVehicle = createMutation<VehicleDto, CreateVehicleDto, AxiosError>({
	mutationKey: ['create-vehicle'],
	mutationFn: async variables => {
		return vehicleApi.createVehicle(variables).then(res => res.data);
	},
});

export const useUpdateVehicle = createMutation<VehicleDto, UpdateVehicleDto, AxiosError>({
	mutationFn: async variables => {
		return vehicleApi.updateVehicle(variables).then(res => res.data);
	},
});
