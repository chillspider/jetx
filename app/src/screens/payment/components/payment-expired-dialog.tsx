/* eslint-disable react-native/no-inline-styles */
import { Text } from '@rneui/themed';
import React from 'react';
import { useTranslation } from 'react-i18next';

import IcError from '@/assets/svgs/ic_error.svg';
import { Box, Dialog } from '@/components';

type Props = {
	onClose?: () => void;
};

const PaymentExpiredDialog: React.FC<Props> = ({ onClose }) => {
	const { t } = useTranslation();

	return (
		<Dialog
			isVisible
			isRequired
			title={t('process.payment_expired_title')}
			onClosed={onClose}
			onConfirm={onClose}
			confirmLabel={t('know')}
		>
			<Box>
				<Box justifyContent="center" alignItems="center">
					<IcError />
					<Box height={8} />
					<Text style={{ textAlign: 'center' }}>{t('process.payment_expired_text')}</Text>
				</Box>
				<Box height={20} />
			</Box>
		</Dialog>
	);
};

export default PaymentExpiredDialog;
