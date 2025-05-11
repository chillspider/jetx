import React, { PropsWithChildren, useEffect, useMemo } from 'react';

import { VehicleDto } from '@/models/vehicle/vehicle.dto';

import { useVehicles } from '../hooks/useVehicles';
import { useAuth } from '../store/auth';

type VehicleContextType = {
	vehicles: VehicleDto[];
	defaultVehicle?: VehicleDto | undefined;
	refetch: () => void;
};

const VehicleContext = React.createContext<VehicleContextType | string>(
	'useVehicleContext should be used inside VehicleProvider',
);

export const VehicleProvider: React.FC<PropsWithChildren> = ({ children }) => {
	const { loggedIn } = useAuth();

	const { data: vehicles, refetch } = useVehicles({
		variables: { takeAll: true },
		enabled: false,
	});

	useEffect(() => {
		if (loggedIn) {
			refetch();
		}
	}, [loggedIn, refetch]);

	const vehicle = useMemo(() => {
		const defaultVehicle = vehicles?.find(v => v.isDefault);
		return defaultVehicle;
	}, [vehicles]);

	const value: VehicleContextType = {
		vehicles: vehicles || [],
		defaultVehicle: vehicle,
		refetch,
	};

	return <VehicleContext.Provider {...{ value, children }} />;
};

export const useVehicleContext = () => {
	const c = React.useContext(VehicleContext);

	if (typeof c === 'string') {
		throw Error(c);
	}

	return c;
};
