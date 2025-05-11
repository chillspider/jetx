import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';

import { useAuth } from '@/core/store/auth';

export const useDeviceRegistration = () => {
	const [isTokenRegistered, setIsTokenRegistered] = useState(false);
	const { registerDevice } = useAuth();

	useFocusEffect(
		useCallback(() => {
			if (!isTokenRegistered) {
				registerDevice();
				setIsTokenRegistered(true);
			}
		}, [isTokenRegistered, registerDevice]),
	);
};
