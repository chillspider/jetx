import { useRoute } from '@react-navigation/native';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Box, ContentWrapper, Header, ScreenWrapper } from '@/components';
import { PaymentProvider, usePaymentContext } from '@/core/contexts/payment-context';
import { AppRouteProp } from '@/types/navigation';

import StartProcessStep, { Step } from './components/start-process-step';
import StepParkingCheck from './components/step-parking-check';
import StepPayment from './components/step-payment';
import StepSafeCheck from './components/step-safe-check';

const StartProcessScreenWrapper: React.FC = () => {
	return (
		<PaymentProvider>
			<StartProcessScreen />
		</PaymentProvider>
	);
};

const StartProcessScreen: React.FC = () => {
	const {
		params: { device },
	} = useRoute<AppRouteProp<'StartProcess'>>();

	const { t } = useTranslation();

	const [step, setStep] = useState<Step>('one');

	const { setDevice } = usePaymentContext();

	useEffect(() => {
		setDevice(device);
	}, [device, setDevice]);

	const renderStepView = useMemo(() => {
		switch (step) {
			case 'one':
				return (
					<StepParkingCheck
						device={device}
						onNext={() => {
							setStep('two');
						}}
					/>
				);
			case 'two':
				return (
					<StepSafeCheck
						device={device}
						onNext={() => {
							setStep('three');
						}}
					/>
				);
			case 'three':
				return <StepPayment device={device} />;

			default:
				return <Box />;
		}
	}, [device, step]);

	const titleByStep = useMemo(() => {
		if (step === 'one') return t('process.title');
		if (step === 'two') return t('process.safeCheckTitle');

		return t('process.paymentQR');
	}, [step, t]);

	return (
		<ScreenWrapper>
			<Header title={titleByStep} />
			<ContentWrapper>
				<StartProcessStep step={step} />
				{renderStepView}
			</ContentWrapper>
		</ScreenWrapper>
	);
};

export default StartProcessScreenWrapper;
