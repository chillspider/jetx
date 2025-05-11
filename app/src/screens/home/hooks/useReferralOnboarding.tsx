import { isNil, isNotNil } from 'ramda';
import { useCallback, useEffect, useState } from 'react';

import { useIsFirstTime } from '@/core/hooks';
import { useAuth } from '@/core/store/auth';
import { useReferralShowed } from '@/core/store/auth/utils';

const useReferralOnboarding = () => {
	const [isFirstTime, setIsFirstTime] = useIsFirstTime();

	const [isReferralShowed, setIsReferralShowed] = useReferralShowed();

	const [canShowReferralInput, setShowReferralInput] = useState<boolean>(false);

	const { user } = useAuth();

	useEffect(() => {
		if (isNil(user)) return;

		if (isFirstTime && !!user) {
			setIsFirstTime(false);
			if (!(user?.isReferred ?? false)) {
				setShowReferralInput(true);
			}
		}
	}, [isFirstTime, setIsFirstTime, setIsReferralShowed, user]);

	useEffect(() => {
		if (isNotNil(user) && !isReferralShowed && !(user?.isReferred ?? false)) {
			setShowReferralInput(true);
		}
	}, [isReferralShowed, setIsReferralShowed, user]);

	const dismissReferralInput = useCallback(() => {
		setShowReferralInput(false);
		setIsReferralShowed(true);
	}, [setIsReferralShowed]);

	return [canShowReferralInput, dismissReferralInput] as const;
};

export default useReferralOnboarding;
