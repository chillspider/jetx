/* eslint-disable react-native/no-inline-styles */
import { Button, Text } from '@rneui/themed';
import React from 'react';
import { useTranslation } from 'react-i18next';

import IcError from '@/assets/svgs/ic_error.svg';
import { Box, Dialog } from '@/components';

type Props = {
	onClose?: () => void;
};

const ReferralFailedDialog: React.FC<Props> = ({ onClose }) => {
	const { t } = useTranslation();

	return (
		<Dialog isVisible actionVisible={false} title={t('referral.failed_title')} onClosed={onClose}>
			<Box>
				<Box justifyContent="center" alignItems="center">
					<IcError />
					<Box height={8} />
					<Text style={{ textAlign: 'center' }}>{t('referral.failed_text')}</Text>
				</Box>
				<Box height={20} />
				<Button title={t('referral.know')} onPress={onClose} />
			</Box>
		</Dialog>
	);
};

export default ReferralFailedDialog;
