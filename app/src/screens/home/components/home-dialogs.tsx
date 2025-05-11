import { useIsFocused, useNavigation } from '@react-navigation/native';
import { makeStyles, Text } from '@rneui/themed';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import IcError from '@/assets/svgs/ic_error.svg';
import { Box, Dialog } from '@/components';
import { Loading } from '@/components/loading';
import { useAuth } from '@/core/store/auth';
import { MainNavNavigationProp } from '@/types/navigation';

import { useSubmitReferral } from '../../../core/hooks/useSubmitReferral';
import ReferralFailedDialog from '../../referral/dialogs/referral-failed';
import ReferralInputDialog from '../../referral/dialogs/referral-input-dialog';
import ReferralSuccessDialog from '../../referral/dialogs/referral-success';
import { useNoticePaymentDefault } from '../hooks/useNoticePaymentDefault';
import useReferralOnboarding from '../hooks/useReferralOnboarding';

const HomeDialogs: React.FC = () => {
	const styles = useStyles();
	const { t } = useTranslation();
	const navigation = useNavigation<MainNavNavigationProp<'Home'>>();
	const { getProfile } = useAuth();
	const isScreenFocused = useIsFocused();

	// Payment method notice state
	const [isOpenPaymentMethodSetting, closePaymentMethodNotice] = useNoticePaymentDefault();

	// Referral states
	const [canShowReferralInput, dismissReferralInput] = useReferralOnboarding();
	const [showReferralSuccessDialog, setShowReferralSuccessDialog] = useState<boolean>(false);
	const [showReferralFailedDialog, setShowReferralFailedDialog] = useState<boolean>(false);
	const [isShowReferralStep, setIsShowReferralStep] = useState<boolean>(false);

	// Referral mutation
	const referralMutation = useSubmitReferral({
		onSuccess: () => {
			getProfile();
			setShowReferralSuccessDialog(true);
		},
		onError: () => {
			setShowReferralFailedDialog(true);
		},
	});

	useEffect(() => {
		if (isScreenFocused && !isOpenPaymentMethodSetting && canShowReferralInput) {
			setIsShowReferralStep(true);
		} else {
			setIsShowReferralStep(false);
		}
	}, [canShowReferralInput, isOpenPaymentMethodSetting, isScreenFocused]);

	const gotoCreatePaymentCard = () => {
		closePaymentMethodNotice();
		navigation.navigate('CreatePaymentCard', { status: undefined });
	};

	return (
		<>
			{isOpenPaymentMethodSetting && (
				<Dialog
					isVisible
					title={t('payment_setting.payment_method_empty_title')}
					closeLabel={t('payment_setting.payment_method_empty_close')}
					confirmLabel={t('payment_setting.payment_method_empty_confirm')}
					onClosed={closePaymentMethodNotice}
					onConfirm={gotoCreatePaymentCard}
				>
					<Box justifyContent="center" alignItems="center">
						<IcError />
						<Box height={12} />
						<Text style={styles.textAlign}>{t('payment_setting.payment_method_empty_desc')}</Text>
					</Box>
				</Dialog>
			)}
			{showReferralSuccessDialog && (
				<ReferralSuccessDialog
					onClose={() => {
						setShowReferralSuccessDialog(false);
					}}
				/>
			)}
			{showReferralFailedDialog && (
				<ReferralFailedDialog
					onClose={() => {
						setShowReferralFailedDialog(false);
					}}
				/>
			)}
			{isShowReferralStep && (
				<ReferralInputDialog
					isVisible={isShowReferralStep}
					onClose={dismissReferralInput}
					onSubmit={code => {
						dismissReferralInput();
						referralMutation.mutate({ referral: code });
					}}
				/>
			)}
			{referralMutation.isPending && <Loading />}
		</>
	);
};

const useStyles = makeStyles(() => ({
	textAlign: {
		textAlign: 'center',
	},
}));

export default HomeDialogs;
