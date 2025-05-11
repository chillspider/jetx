import { isEmpty, isNotEmpty } from 'ramda';
import { useCallback, useMemo } from 'react';

import { useUserCardTokens } from '@/core/hooks/payment/useUserCardTokens';
import { useLoginIsFirstTime } from '@/core/store/auth/utils';

export const useNoticePaymentDefault = () => {
	const [isLoginFirstTime, setLoginIsFirstTime] = useLoginIsFirstTime();

	const { data: cardPages } = useUserCardTokens();

	const paymentCards = useMemo(() => {
		return cardPages?.pages.flatMap(page => page.data || []) || [];
	}, [cardPages?.pages]);

	const isOpenPaymentMethodSetting = useMemo(() => {
		if (isLoginFirstTime && isEmpty(paymentCards)) {
			return true;
		}

		if (isLoginFirstTime && isNotEmpty(paymentCards)) {
			setLoginIsFirstTime(false);
		}

		return false;
	}, [isLoginFirstTime, paymentCards, setLoginIsFirstTime]);

	const closePaymentMethodNotice = useCallback(() => {
		setLoginIsFirstTime(false);
	}, [setLoginIsFirstTime]);

	return [isOpenPaymentMethodSetting, closePaymentMethodNotice] as const;
};
