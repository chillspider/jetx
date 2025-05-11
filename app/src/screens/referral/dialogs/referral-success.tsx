/* eslint-disable react-native/no-inline-styles */
import { Button, Text } from '@rneui/themed';
import React from 'react';
import { useTranslation } from 'react-i18next';

import IcSuccess from '@/assets/svgs/ic-congratulation.svg';
import { Box, Dialog } from '@/components';

type Props = {
	onClose?: () => void;
};

const ReferralSuccessDialog: React.FC<Props> = ({ onClose }) => {
	const { t } = useTranslation();

	return (
		<Dialog isVisible actionVisible={false} title={t('referral.success_title')} onClosed={onClose}>
			<Box>
				<Box justifyContent="center" alignItems="center">
					<IcSuccess />
					<Box height={8} />
					<Text style={{ textAlign: 'center' }}>{t('referral.success_text')}</Text>
				</Box>
				<Box height={20} />
				<Button title={t('referral.know')} onPress={onClose} />
			</Box>
		</Dialog>
	);
};

export default ReferralSuccessDialog;
